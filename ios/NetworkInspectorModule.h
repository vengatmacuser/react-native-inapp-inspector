#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNInAppInspectorSpec/RNInAppInspectorSpec.h>
@interface NetworkInspectorModule : RCTEventEmitter <NativeNetworkInspectorSpec, RCTBridgeModule>
#else
@interface NetworkInspectorModule : RCTEventEmitter <RCTBridgeModule>
#endif

- (void)emitCrashEventWithMessage:(NSString *)message stackTrace:(NSString *)stackTrace;

@end

