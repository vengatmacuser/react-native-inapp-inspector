#import "NetworkInspectorModule.h"
#import <execinfo.h>
#import <signal.h>
#import <unistd.h>

static NetworkInspectorModule *sharedInstance = nil;
static NSUncaughtExceptionHandler *previousUncaughtExceptionHandler = NULL;

static void NativeSignalHandler(int signalNumber) {
    void* callstack[128];
    int frames = backtrace(callstack, 128);
    char **strs = backtrace_symbols(callstack, frames);

    NSMutableArray *backtraceArray = [NSMutableArray arrayWithCapacity:frames];
    for (int i = 0; i < frames; i++) {
        if (strs[i]) {
            [backtraceArray addObject:[NSString stringWithUTF8String:strs[i]]];
        }
    }
    free(strs);

    NSString *stackTrace = [backtraceArray componentsJoinedByString:@"\n"];
    NSString *signalName = @"UNKNOWN";
    switch (signalNumber) {
        case SIGABRT: signalName = @"SIGABRT (Abort)"; break;
        case SIGSEGV: signalName = @"SIGSEGV (Segmentation Fault)"; break;
        case SIGBUS:  signalName = @"SIGBUS (Bus Error)"; break;
        case SIGILL:  signalName = @"SIGILL (Illegal Instruction)"; break;
        case SIGFPE:  signalName = @"SIGFPE (Floating Point Exception)"; break;
        case SIGPIPE: signalName = @"SIGPIPE (Broken Pipe)"; break;
        case SIGTRAP: signalName = @"SIGTRAP (Trace Trap)"; break;
    }

    NSString *message = [NSString stringWithFormat:@"Native Signal Crash: %@", signalName];
    if (sharedInstance != nil) {
        [sharedInstance emitCrashEventWithMessage:message stackTrace:stackTrace];
    }
}

static void NativeExceptionHandler(NSException *exception) {
    NSArray *callStack = [exception callStackSymbols];
    NSString *stackTrace = [callStack componentsJoinedByString:@"\n"];
    NSString *message = [NSString stringWithFormat:@"%@: %@", [exception name], [exception reason]];

    if (sharedInstance != nil) {
        [sharedInstance emitCrashEventWithMessage:message stackTrace:stackTrace];
    }

    // Keep the runloop cycling so the UI thread doesn't terminate immediately
    CFRunLoopRef runLoop = CFRunLoopGetCurrent();
    CFArrayRef allModes = CFRunLoopCopyAllModes(runLoop);
    while (true) {
        for (NSString *mode in (__bridge NSArray *)allModes) {
            CFRunLoopRunInMode((CFStringRef)mode, 0.001, false);
        }
    }
}

@implementation NetworkInspectorModule {
    bool hasListeners;
}

RCT_EXPORT_MODULE(NetworkInspectorModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    if (self = [super init]) {
        sharedInstance = self;
        [self installHandlers];
    }
    return self;
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onNativeCrash"];
}

- (void)installHandlers {
    previousUncaughtExceptionHandler = NSGetUncaughtExceptionHandler();
    NSSetUncaughtExceptionHandler(&NativeExceptionHandler);

    struct sigaction sa;
    sa.sa_handler = NativeSignalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_NODEFER;

    sigaction(SIGABRT, &sa, NULL);
    sigaction(SIGSEGV, &sa, NULL);
    sigaction(SIGBUS,  &sa, NULL);
    sigaction(SIGILL,  &sa, NULL);
    sigaction(SIGFPE,  &sa, NULL);
    sigaction(SIGPIPE, &sa, NULL);
    sigaction(SIGTRAP, &sa, NULL);
}

- (void)emitCrashEventWithMessage:(NSString *)message stackTrace:(NSString *)stackTrace {
    if (hasListeners) {
        [self sendEventWithName:@"onNativeCrash"
                           body:@{
                                  @"platform": @"ios",
                                  @"message": message ?: @"Unknown iOS Native Exception",
                                  @"stack": stackTrace ?: @"",
                                  @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
                                }];
    }
}

RCT_EXPORT_METHOD(enableNativeCrashProtection:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self installHandlers];
    resolve(@(YES));
}

@end
