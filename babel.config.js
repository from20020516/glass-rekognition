module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // IMPORTANT: https://github.com/software-mansion/react-native-reanimated/issues/1875#issuecomment-1080045547
    'react-native-reanimated/plugin',
  ]
};
