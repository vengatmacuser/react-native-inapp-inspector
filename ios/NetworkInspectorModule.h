#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface NetworkInspectorModule : RCTEventEmitter <RCTBridgeModule>

- (void)emitCrashEventWithMessage:(NSString *)message stackTrace:(NSString *)stackTrace;

@end
