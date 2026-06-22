module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@notifee/react-native|react-native-bootsplash|react-native-geolocation-service|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-share|react-native-vector-icons|react-native-blob-util|react-native-html-to-pdf|react-native-toast-message|immer|@reduxjs/toolkit|react-native-image-picker|react-native-element-dropdown|react-native-modal|react-native-animatable|react-native-webview)/)',
  ],
};
