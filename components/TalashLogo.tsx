import { Image, View } from 'react-native';

type TalashLogoProps = {
  size?: number;
};

export function TalashLogo({ size = 40 }: TalashLogoProps) {
  return (
    <View
      className="overflow-hidden rounded-xl"
      style={{ width: size, height: size }}
      accessibilityLabel="talash logo"
    >
      <Image
        source={require('../assets/talash-logo.png')}
        resizeMode="stretch"
        style={{ width: size, height: size * 2 }}
      />
    </View>
  );
}
