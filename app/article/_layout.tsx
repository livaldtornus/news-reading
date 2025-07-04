import { Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArticleLayout() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
   
            <Stack screenOptions={{ headerShown: false, presentation: 'card' }} />  

        </SafeAreaView>
      );
   
;
}