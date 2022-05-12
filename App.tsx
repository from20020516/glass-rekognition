import 'react-native-reanimated'
import React, { useEffect, useState, useRef } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  View,
  Text,
  PermissionsAndroid,
} from 'react-native'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { readFile, unlink } from 'react-native-fs'
import Config from 'react-native-config'
import axios from 'axios'
import { format } from 'date-fns'
import { Rekognition } from 'aws-sdk'

const client = axios.create({
  baseURL: Config.API_ENDPOINT,
})

interface WikiData {
  entities: {
    [id: string]: {
      pageid: number
      ns: number
      title: string
      lastrevid: number
      modified: string
      type: string
      id: string
      labels: {
        [lang: string]: {
          language: string
          value: string /* name */
        }
      }
      descriptions: {
        [lang: string]: {
          language: string
          value: string /* description */
        }
      }
    }
  }
  success: number
}

const getWikiData = async (urls: string[]) => {
  try {
    const id = urls.find(url => url.includes('wikidata.org'))?.split('/').pop()!
    const wikiData = await axios.get<WikiData>(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json&languages=ja`)
    return {
      name: wikiData.data.entities[id].labels.ja.value,
      description: wikiData.data.entities[id].descriptions.ja.value
    }
  } catch {
    return {
      name: undefined,
      description: undefined
    }
  }
}

const FaceRekognition = () => {
  const devices = useCameraDevices()
  const device = devices.back
  const camera = useRef<Camera>(null)

  const faceRange = useSharedValue({ top: 0, left: 0, right: 0, bottom: 0 })
  const [content, setContent] = useState<string | undefined>()

  useEffect(() => {
    let timeout = setTimeout(async () => {
      const snapshot = await camera.current?.takeSnapshot({ quality: 100, skipMetadata: true })
      const time = format(new Date(), 'hh:mm:ss')
      if (snapshot) {
        try {
          const blob = await readFile(snapshot?.path, 'base64')
          const results = (await client.post<Rekognition.RecognizeCelebritiesResponse>('/celeb', blob)).data.CelebrityFaces?.[0]

          const { Width, Height, Left, Top } = results?.Face?.BoundingBox ?? {}
          faceRange.value = {
            top: 360 * Number(Top),
            bottom: 360 * Number(Height),
            left: 640 * Number(Left),
            right: 640 * Number(Width)
          }

          if (results) {
            const { name, description } = await getWikiData(results.Urls!)
            setContent(`${time} ${name ?? results.Name} (${Math.round(results.MatchConfidence! * 10) / 10}%)\n${description}`)
          } else {
            setContent(time)
          }
        } catch (error) {
          console.error(error)
          setContent(`${time} ${(error as Error).message}`)
        } finally {
          await unlink(snapshot.path)
        }
      }
    }, 1000)
    return () => clearTimeout(timeout)
  }, [content])

  // const frameProcessor = useFrameProcessor(async (frame) => {
  //   'worklet'
  // }, [faceRange])

  const boxOverlayStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'red',
    ...faceRange.value
  }), [faceRange])

  if (!device) return <ActivityIndicator />

  return (
    <View>
      <Camera
        ref={camera}
        device={device}
        // frameProcessor={frameProcessor}
        // frameProcessorFps={1}
        // preset='medium'
        isActive={true}
        photo={true}
        zoom={3}
        style={{ height: 360 }}
      />
      <View style={{
        backgroundColor: 'black',
        justifyContent: 'center',
        top: 260,
        left: 0,
        opacity: 0.7,
        position: 'absolute',
        width: 640,
        height: 100,
      }}>
        <Text
          style={{
            fontSize: 30,
            color: 'white',
            marginLeft: 20,
          }}
        >{content}</Text>
      </View>
      <Reanimated.View style={boxOverlayStyle} />
    </View>
  )
}

const App = () => {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    (async () => {
      const isGranted =
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA) === PermissionsAndroid.RESULTS.GRANTED
      isGranted
        ? setGranted(isGranted)
        : BackHandler.exitApp()
    })()
  }, [])

  return (
    <View
      style={{
        backgroundColor: 'white',
        flex: 1,
      }}
    >
      {granted
        ? (<FaceRekognition />)
        : <></>
      }
    </View>
  )
}

export default App
