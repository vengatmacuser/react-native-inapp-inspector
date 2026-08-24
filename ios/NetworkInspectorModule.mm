#import "NetworkInspectorModule.h"
#import <execinfo.h>
#import <signal.h>
#import <unistd.h>

static NetworkInspectorModule *sharedInstance = nil;
static NSUncaughtExceptionHandler *previousUncaughtExceptionHandler = NULL;

@interface InAppInspectorFloatingView : UIView
@property (nonatomic, copy) void (^onTapBlock)(void);
@property (nonatomic, strong) UIView *badgeDot;
- (void)updateBadgeVisible:(BOOL)visible;
@end

@interface InAppInspectorOwlView : UIView
@end

@implementation InAppInspectorOwlView

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        self.backgroundColor = [UIColor clearColor];
        self.userInteractionEnabled = NO;
        self.contentMode = UIViewContentModeRedraw;
        self.clipsToBounds = NO;
    }
    return self;
}

- (void)drawRect:(CGRect)rect {
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    if (!ctx) return;
    
    CGFloat w = rect.size.width;
    CGFloat scale = w / 256.0;
    
    CGContextSaveGState(ctx);
    CGContextScaleCTM(ctx, scale, scale);
    
    // 1. Owl Body with Ears
    UIBezierPath *bodyPath = [UIBezierPath bezierPath];
    [bodyPath moveToPoint:CGPointMake(62, 150)];
    [bodyPath addCurveToPoint:CGPointMake(90, 58) controlPoint1:CGPointMake(58, 104) controlPoint2:CGPointMake(70, 70)];
    [bodyPath addLineToPoint:CGPointMake(98, 42)]; // Left ear
    [bodyPath addLineToPoint:CGPointMake(116, 62)];
    [bodyPath addQuadCurveToPoint:CGPointMake(140, 62) controlPoint:CGPointMake(128, 57)];
    [bodyPath addLineToPoint:CGPointMake(158, 42)]; // Right ear
    [bodyPath addLineToPoint:CGPointMake(166, 58)];
    [bodyPath addCurveToPoint:CGPointMake(194, 150) controlPoint1:CGPointMake(186, 70) controlPoint2:CGPointMake(198, 104)];
    [bodyPath addCurveToPoint:CGPointMake(152, 212) controlPoint1:CGPointMake(198, 180) controlPoint2:CGPointMake(184, 204)];
    [bodyPath addCurveToPoint:CGPointMake(104, 212) controlPoint1:CGPointMake(140, 216) controlPoint2:CGPointMake(116, 216)];
    [bodyPath addCurveToPoint:CGPointMake(62, 150) controlPoint1:CGPointMake(72, 204) controlPoint2:CGPointMake(58, 180)];
    [bodyPath closePath];
    
    [[UIColor colorWithRed:32.0/255.0 green:46.0/255.0 blue:85.0/255.0 alpha:1.0] setFill];
    [bodyPath fill];
    
    [[UIColor colorWithRed:56.0/255.0 green:189.0/255.0 blue:248.0/255.0 alpha:1.0] setStroke];
    bodyPath.lineWidth = 4.0;
    [bodyPath stroke];
    
    // 2. Wings
    UIBezierPath *leftWing = [UIBezierPath bezierPath];
    [leftWing moveToPoint:CGPointMake(74, 124)];
    [leftWing addCurveToPoint:CGPointMake(86, 204) controlPoint1:CGPointMake(58, 154) controlPoint2:CGPointMake(60, 190)];
    [leftWing addCurveToPoint:CGPointMake(88, 126) controlPoint1:CGPointMake(79, 176) controlPoint2:CGPointMake(77, 148)];
    [leftWing closePath];
    [[UIColor colorWithRed:26.0/255.0 green:37.0/255.0 blue:69.0/255.0 alpha:1.0] setFill];
    [leftWing fill];
    
    UIBezierPath *rightWing = [UIBezierPath bezierPath];
    [rightWing moveToPoint:CGPointMake(182, 124)];
    [rightWing addCurveToPoint:CGPointMake(170, 204) controlPoint1:CGPointMake(198, 154) controlPoint2:CGPointMake(196, 190)];
    [rightWing addCurveToPoint:CGPointMake(168, 126) controlPoint1:CGPointMake(177, 176) controlPoint2:CGPointMake(179, 148)];
    [rightWing closePath];
    [[UIColor colorWithRed:26.0/255.0 green:37.0/255.0 blue:69.0/255.0 alpha:1.0] setFill];
    [rightWing fill];
    
    // 3. Belly Plate
    UIBezierPath *belly = [UIBezierPath bezierPath];
    [belly moveToPoint:CGPointMake(128, 126)];
    [belly addCurveToPoint:CGPointMake(162, 174) controlPoint1:CGPointMake(151, 126) controlPoint2:CGPointMake(164, 148)];
    [belly addCurveToPoint:CGPointMake(128, 212) controlPoint1:CGPointMake(160, 198) controlPoint2:CGPointMake(146, 212)];
    [belly addCurveToPoint:CGPointMake(94, 174) controlPoint1:CGPointMake(110, 212) controlPoint2:CGPointMake(96, 198)];
    [belly addCurveToPoint:CGPointMake(128, 126) controlPoint1:CGPointMake(92, 148) controlPoint2:CGPointMake(105, 126)];
    [belly closePath];
    [[UIColor colorWithRed:51.0/255.0 green:71.0/255.0 blue:122.0/255.0 alpha:1.0] setFill];
    [belly fill];
    
    // 4. Chest Screen `< / >`
    UIBezierPath *screen = [UIBezierPath bezierPathWithRoundedRect:CGRectMake(107, 161, 42, 32) cornerRadius:8];
    [[UIColor colorWithRed:12.0/255.0 green:20.0/255.0 blue:38.0/255.0 alpha:1.0] setFill];
    [screen fill];
    [[UIColor colorWithRed:56.0/255.0 green:189.0/255.0 blue:248.0/255.0 alpha:0.8] setStroke];
    screen.lineWidth = 2.0;
    [screen stroke];
    
    UIBezierPath *codeLines = [UIBezierPath bezierPath];
    [codeLines moveToPoint:CGPointMake(122, 170)];
    [codeLines addLineToPoint:CGPointMake(115, 177)];
    [codeLines addLineToPoint:CGPointMake(122, 184)];
    [codeLines moveToPoint:CGPointMake(134, 170)];
    [codeLines addLineToPoint:CGPointMake(141, 177)];
    [codeLines addLineToPoint:CGPointMake(134, 184)];
    [codeLines moveToPoint:CGPointMake(130, 168)];
    [codeLines addLineToPoint:CGPointMake(126, 186)];
    [[UIColor colorWithRed:143.0/255.0 green:208.0/255.0 blue:236.0/255.0 alpha:1.0] setStroke];
    codeLines.lineWidth = 3.0;
    codeLines.lineCapStyle = kCGLineCapRound;
    codeLines.lineJoinStyle = kCGLineJoinRound;
    [codeLines stroke];
    
    // 5. Normal Right Eye
    UIBezierPath *rightEye = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(136, 90, 34, 34)];
    [[UIColor colorWithRed:251.0/255.0 green:191.0/255.0 blue:36.0/255.0 alpha:1.0] setFill];
    [rightEye fill];
    [[UIColor colorWithRed:26.0/255.0 green:18.0/255.0 blue:5.0/255.0 alpha:1.0] setStroke];
    rightEye.lineWidth = 2.2;
    [rightEye stroke];
    
    UIBezierPath *rightPupil = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(145, 100, 16, 16)];
    [[UIColor colorWithRed:10.0/255.0 green:14.0/255.0 blue:24.0/255.0 alpha:1.0] setFill];
    [rightPupil fill];
    
    UIBezierPath *rightGlint = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(153, 98, 6, 6)];
    [[UIColor whiteColor] setFill];
    [rightGlint fill];
    
    // 6. Beak
    UIBezierPath *beak = [UIBezierPath bezierPath];
    [beak moveToPoint:CGPointMake(123.5, 123)];
    [beak addQuadCurveToPoint:CGPointMake(132.5, 123) controlPoint:CGPointMake(128, 121)];
    [beak addQuadCurveToPoint:CGPointMake(128, 134.5) controlPoint:CGPointMake(131, 132)];
    [beak addQuadCurveToPoint:CGPointMake(123.5, 123) controlPoint:CGPointMake(125, 132)];
    [beak closePath];
    [[UIColor colorWithRed:251.0/255.0 green:146.0/255.0 blue:60.0/255.0 alpha:1.0] setFill];
    [beak fill];
    
    // 7. Magnifier Debug Left Eye
    UIBezierPath *leftEye = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(75, 83, 40, 40)];
    [[UIColor colorWithRed:251.0/255.0 green:191.0/255.0 blue:36.0/255.0 alpha:1.0] setFill];
    [leftEye fill];
    [[UIColor colorWithRed:26.0/255.0 green:18.0/255.0 blue:5.0/255.0 alpha:1.0] setStroke];
    leftEye.lineWidth = 2.6;
    [leftEye stroke];
    
    UIBezierPath *leftPupil = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(85, 94, 20, 20)];
    [[UIColor colorWithRed:10.0/255.0 green:14.0/255.0 blue:24.0/255.0 alpha:1.0] setFill];
    [leftPupil fill];
    
    UIBezierPath *leftGlint = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(95, 92, 7, 7)];
    [[UIColor whiteColor] setFill];
    [leftGlint fill];
    
    // Magnifier Lens Ring & Handle
    UIBezierPath *handle = [UIBezierPath bezierPath];
    [handle moveToPoint:CGPointMake(75, 123)];
    [handle addLineToPoint:CGPointMake(54, 147)];
    [[UIColor colorWithRed:56.0/255.0 green:189.0/255.0 blue:248.0/255.0 alpha:1.0] setStroke];
    handle.lineWidth = 8.5;
    handle.lineCapStyle = kCGLineCapRound;
    [handle stroke];
    
    UIBezierPath *lensRing = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(67, 75, 56, 56)];
    lensRing.lineWidth = 7.0;
    [lensRing stroke];
    
    // Rosy Cheeks
    UIBezierPath *leftCheek = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(74, 121, 18, 12)];
    [[UIColor colorWithRed:251.0/255.0 green:113.0/255.0 blue:133.0/255.0 alpha:0.5] setFill];
    [leftCheek fill];
    
    UIBezierPath *rightCheek = [UIBezierPath bezierPathWithOvalInRect:CGRectMake(158, 116, 18, 12)];
    [[UIColor colorWithRed:251.0/255.0 green:113.0/255.0 blue:133.0/255.0 alpha:0.5] setFill];
    [rightCheek fill];
    
    CGContextRestoreGState(ctx);
}

@end

@interface InAppInspectorFloatingView () <UIGestureRecognizerDelegate>
@property (nonatomic, assign) CGPoint panStartCenter;
@property (nonatomic, assign) NSTimeInterval lastTapTime;
@end

@implementation InAppInspectorFloatingView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.userInteractionEnabled = YES;
        self.multipleTouchEnabled = NO;
        self.layer.cornerRadius = frame.size.width / 2.0;
        self.layer.masksToBounds = NO;
        self.backgroundColor = [UIColor colorWithRed:15.0/255.0 green:23.0/255.0 blue:42.0/255.0 alpha:0.95];
        
        // Glow shadow
        self.layer.shadowColor = [UIColor colorWithRed:56.0/255.0 green:189.0/255.0 blue:248.0/255.0 alpha:0.65].CGColor;
        self.layer.shadowOffset = CGSizeMake(0, 5);
        self.layer.shadowRadius = 10;
        self.layer.shadowOpacity = 1.0;
        self.layer.borderWidth = 2.2;
        self.layer.borderColor = [UIColor colorWithRed:56.0/255.0 green:189.0/255.0 blue:248.0/255.0 alpha:0.9].CGColor;
        
        // Native drawn Inspector Owl icon
        CGFloat iconSize = frame.size.width * 0.94;
        CGFloat iconOffset = (frame.size.width - iconSize) / 2.0;
        InAppInspectorOwlView *owlView = [[InAppInspectorOwlView alloc] initWithFrame:CGRectMake(iconOffset, iconOffset, iconSize, iconSize)];
        owlView.userInteractionEnabled = NO;
        [self addSubview:owlView];

        // Dedicated Tap Gesture Recognizer
        UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTapGesture:)];
        tap.numberOfTapsRequired = 1;
        tap.cancelsTouchesInView = NO;
        tap.delegate = self;
        [self addGestureRecognizer:tap];

        // Dedicated Pan Gesture Recognizer
        UIPanGestureRecognizer *pan = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handlePanGesture:)];
        pan.delegate = self;
        [self addGestureRecognizer:pan];
    }
    return self;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    if (!self.userInteractionEnabled || self.hidden || self.alpha < 0.01) {
        return nil;
    }
    if (CGRectContainsPoint(self.bounds, point)) {
        return self;
    }
    return [super hitTest:point withEvent:event];
}

- (void)updateBadgeVisible:(BOOL)visible {
    // Active badge dot
}

- (void)handleTapGesture:(UITapGestureRecognizer *)gesture {
    if (gesture.state == UIGestureRecognizerStateEnded) {
        [self triggerTapAction];
    }
}

- (void)triggerTapAction {
    NSTimeInterval now = CACurrentMediaTime();
    if (now - self.lastTapTime < 0.35) return;
    self.lastTapTime = now;

    if (@available(iOS 10.0, *)) {
        UIImpactFeedbackGenerator *impact = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
        [impact prepare];
        [impact impactOccurred];
    }

    [UIView animateWithDuration:0.08 animations:^{
        self.transform = CGAffineTransformMakeScale(0.90, 0.90);
    } completion:^(BOOL finished) {
        [UIView animateWithDuration:0.10 animations:^{
            self.transform = CGAffineTransformIdentity;
        }];
    }];

    if (self.onTapBlock) {
        self.onTapBlock();
    }
}

- (void)handlePanGesture:(UIPanGestureRecognizer *)pan {
    UIView *superview = self.superview;
    if (!superview) return;

    if (pan.state == UIGestureRecognizerStateBegan) {
        self.panStartCenter = self.center;
        [superview bringSubviewToFront:self];
        [UIView animateWithDuration:0.1 animations:^{
            self.transform = CGAffineTransformMakeScale(1.06, 1.06);
        }];
    } else if (pan.state == UIGestureRecognizerStateChanged) {
        CGPoint translation = [pan translationInView:superview];
        CGFloat halfW = self.bounds.size.width / 2.0;
        CGFloat halfH = self.bounds.size.height / 2.0;
        CGFloat minX = halfW + 10.0;
        CGFloat maxX = superview.bounds.size.width - halfW - 10.0;
        CGFloat minY = halfH + 44.0;
        CGFloat maxY = superview.bounds.size.height - halfH - 44.0;

        CGPoint newCenter = CGPointMake(self.panStartCenter.x + translation.x, self.panStartCenter.y + translation.y);
        newCenter.x = MAX(minX, MIN(maxX, newCenter.x));
        newCenter.y = MAX(minY, MIN(maxY, newCenter.y));
        self.center = newCenter;
    } else if (pan.state == UIGestureRecognizerStateEnded || pan.state == UIGestureRecognizerStateCancelled) {
        [UIView animateWithDuration:0.15 animations:^{
            self.transform = CGAffineTransformIdentity;
        }];

        CGFloat halfW = self.bounds.size.width / 2.0;
        CGFloat minX = halfW + 10.0;
        CGFloat maxX = superview.bounds.size.width - halfW - 10.0;
        CGFloat targetX = (self.center.x < superview.bounds.size.width / 2.0) ? minX : maxX;
        [UIView animateWithDuration:0.25 delay:0 usingSpringWithDamping:0.75 initialSpringVelocity:0.5 options:UIViewAnimationOptionCurveEaseOut animations:^{
            self.center = CGPointMake(targetX, self.center.y);
        } completion:nil];
    }
}

@end

static InAppInspectorFloatingView *floatingButtonView = nil;

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
    CADisplayLink *displayLink;
    CFTimeInterval lastFpsTimestamp;
    NSInteger frameCount;
    double currentCalculatedFps;
    dispatch_queue_t _networkQueue;
    dispatch_queue_t _consoleQueue;
    dispatch_queue_t _analyticsQueue;
    dispatch_queue_t _reduxQueue;
    dispatch_queue_t _crashQueue;
    dispatch_queue_t _metricsQueue;
    NSMutableArray *_nativeNetworkLogs;
    NSMutableArray *_nativeConsoleLogs;
    NSMutableArray *_nativeAnalyticsEvents;
    NSMutableArray *_nativeCrashRecords;
}

RCT_EXPORT_MODULE(NetworkInspectorModule);

- (instancetype)init {
    if (self = [super init]) {
        sharedInstance = self;
        self->currentCalculatedFps = 60.0;
        self->_networkQueue = dispatch_queue_create("com.inappinspector.network", DISPATCH_QUEUE_SERIAL);
        self->_consoleQueue = dispatch_queue_create("com.inappinspector.console", DISPATCH_QUEUE_SERIAL);
        self->_analyticsQueue = dispatch_queue_create("com.inappinspector.analytics", DISPATCH_QUEUE_SERIAL);
        self->_reduxQueue = dispatch_queue_create("com.inappinspector.redux", DISPATCH_QUEUE_SERIAL);
        self->_crashQueue = dispatch_queue_create("com.inappinspector.crash", DISPATCH_QUEUE_SERIAL);
        self->_metricsQueue = dispatch_queue_create("com.inappinspector.metrics", DISPATCH_QUEUE_SERIAL);
        self->_nativeNetworkLogs = [NSMutableArray array];
        self->_nativeConsoleLogs = [NSMutableArray array];
        self->_nativeAnalyticsEvents = [NSMutableArray array];
        self->_nativeCrashRecords = [NSMutableArray array];
        [self installHandlers];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleMotionShakeNotification:)
                                                     name:@"RCTShowDevMenuNotification"
                                                   object:nil];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)safeSendEvent:(NSString *)eventName body:(id)body {
    if (!hasListeners) return;
    @try {
        [self sendEventWithName:eventName body:body];
    } @catch (NSException *ex) {
        NSLog(@"[InAppInspector] Safe sendEvent error: %@", ex.reason);
    }
}

- (void)handleMotionShakeNotification:(NSNotification *)notification {
    [self safeSendEvent:@"onDeviceShake" body:@{}];
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onNativeCrash", @"onFloatingButtonPress", @"onDeviceShake"];
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
    [self safeSendEvent:@"onNativeCrash"
                   body:@{
                          @"platform": @"ios",
                          @"message": message ?: @"Unknown iOS Native Exception",
                          @"stack": stackTrace ?: @"",
                          @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
                        }];
}

RCT_EXPORT_METHOD(enableNativeCrashProtection:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    [self installHandlers];
    resolve(@(YES));
}

RCT_EXPORT_METHOD(getDeviceMetrics:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSMutableDictionary *metrics = [NSMutableDictionary dictionary];

    // 1. Memory / RAM Metrics
    unsigned long long physicalMemory = [NSProcessInfo processInfo].physicalMemory;
    [metrics setObject:@(physicalMemory) forKey:@"totalRAM"];

    // App Resident Memory via mach task
    struct mach_task_basic_info info;
    mach_msg_type_number_t count = MACH_TASK_BASIC_INFO_COUNT;
    if (task_info(mach_task_self(), MACH_TASK_BASIC_INFO, (task_info_t)&info, &count) == KERN_SUCCESS) {
        [metrics setObject:@(info.resident_size) forKey:@"residentMemory"];
        [metrics setObject:@(info.virtual_size) forKey:@"virtualMemory"];
    }

    // Free Memory
    mach_port_t host_port = mach_host_self();
    mach_msg_type_number_t host_size = sizeof(vm_statistics64_data_t) / sizeof(integer_t);
    vm_size_t pagesize;
    vm_statistics64_data_t vm_stat;
    host_page_size(host_port, &pagesize);
    if (host_statistics64(host_port, HOST_VM_INFO64, (host_info64_t)&vm_stat, &host_size) == KERN_SUCCESS) {
        unsigned long long freeMem = (vm_stat.free_count + vm_stat.inactive_count) * pagesize;
        [metrics setObject:@(freeMem) forKey:@"freeRAM"];
        [metrics setObject:@(physicalMemory - freeMem) forKey:@"usedRAM"];
    }

    // 2. Storage Metrics
    NSError *error = nil;
    NSDictionary *fsAttrs = [[NSFileManager defaultManager] attributesOfFileSystemForPath:NSHomeDirectory() error:&error];
    if (fsAttrs) {
        NSNumber *freeSize = [fsAttrs objectForKey:NSFileSystemFreeSize];
        NSNumber *totalSize = [fsAttrs objectForKey:NSFileSystemSize];
        if (freeSize) [metrics setObject:freeSize forKey:@"freeStorage"];
        if (totalSize) [metrics setObject:totalSize forKey:@"totalStorage"];
    }

    // 3. Battery Level & State
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    float batteryLevel = [UIDevice currentDevice].batteryLevel;
    if (batteryLevel >= 0.0f) {
        [metrics setObject:@(batteryLevel * 100.0f) forKey:@"batteryPercent"];
    }
    UIDeviceBatteryState bState = [UIDevice currentDevice].batteryState;
    BOOL isCharging = (bState == UIDeviceBatteryStateCharging || bState == UIDeviceBatteryStateFull);
    [metrics setObject:@(isCharging) forKey:@"isCharging"];

    // 4. Device & Hardware Identifiers
    [metrics setObject:[UIDevice currentDevice].model forKey:@"deviceModel"];
    [metrics setObject:[UIDevice currentDevice].systemName forKey:@"deviceBrand"];
    [metrics setObject:[UIDevice currentDevice].systemVersion forKey:@"osVersion"];
    [metrics setObject:@"arm64" forKey:@"cpuAbi"];

    // 5. Application Identifiers (Legal & Non-PII)
    NSBundle *mainBundle = [NSBundle mainBundle];
    NSString *appName = [mainBundle objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: [mainBundle objectForInfoDictionaryKey:@"CFBundleName"];
    NSString *appVersion = [mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    NSString *appBuild = [mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"];
    NSString *appBundleId = [mainBundle bundleIdentifier];
    if (appName) [metrics setObject:appName forKey:@"appName"];
    if (appVersion) [metrics setObject:appVersion forKey:@"appVersion"];
    if (appBuild) [metrics setObject:appBuild forKey:@"appBuild"];
    if (appBundleId) {
        [metrics setObject:appBundleId forKey:@"appBundleId"];
        [metrics setObject:appBundleId forKey:@"appPackageName"];
    }

    resolve(metrics);
}

static UIWindow *GetAppActiveWindow(void) {
    if (@available(iOS 13.0, *)) {
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *ws = (UIWindowScene *)scene;
                for (UIWindow *w in ws.windows) {
                    if (w.isKeyWindow || w.windowLevel == UIWindowLevelNormal) {
                        return w;
                    }
                }
                if (ws.windows.count > 0) {
                    return ws.windows.firstObject;
                }
            }
        }
    }
    for (UIWindow *w in [UIApplication sharedApplication].windows) {
        if (w.isKeyWindow || w.windowLevel == UIWindowLevelNormal) {
            return w;
        }
    }
    return [UIApplication sharedApplication].windows.firstObject;
}

RCT_EXPORT_METHOD(showFloatingButton:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIWindow *targetWindow = GetAppActiveWindow();
        CGRect screenBounds = targetWindow ? targetWindow.bounds : [UIScreen mainScreen].bounds;

        CGFloat screenWidth = screenBounds.size.width > 0 ? screenBounds.size.width : [UIScreen mainScreen].bounds.size.width;
        if (screenWidth <= 0) screenWidth = 393.0;
        CGFloat screenHeight = screenBounds.size.height > 0 ? screenBounds.size.height : [UIScreen mainScreen].bounds.size.height;
        if (screenHeight <= 0) screenHeight = 852.0;

        CGFloat size = 64.0;
        if (options && options[@"size"]) {
            size = [options[@"size"] doubleValue];
        }

        CGFloat initialX = screenWidth - size - 20.0;
        CGFloat initialY = screenHeight - size - 120.0;
        if (options && options[@"x"]) {
            initialX = [options[@"x"] doubleValue];
        }
        if (options && options[@"y"]) {
            initialY = [options[@"y"] doubleValue];
        }

        if (floatingButtonView == nil) {
            floatingButtonView = [[InAppInspectorFloatingView alloc] initWithFrame:CGRectMake(initialX, initialY, size, size)];
            floatingButtonView.layer.zPosition = 999999;
        } else {
            floatingButtonView.layer.zPosition = 999999;
            floatingButtonView.frame = CGRectMake(initialX, initialY, size, size);
        }

        __weak NetworkInspectorModule *weakSelf = self;
        floatingButtonView.onTapBlock = ^{
            NetworkInspectorModule *strongSelf = weakSelf ?: sharedInstance;
            if (strongSelf) {
                [strongSelf safeSendEvent:@"onFloatingButtonPress" body:@{}];
            }
        };

        void (^attachToWindow)(void) = ^{
            UIWindow *activeWin = GetAppActiveWindow();
            if (!activeWin || !floatingButtonView) return;
            
            CGRect winBounds = activeWin.bounds;
            if (winBounds.size.width > 0 && winBounds.size.height > 0) {
                CGRect curFrame = floatingButtonView.frame;
                if (curFrame.origin.x <= 0 || curFrame.origin.x >= winBounds.size.width ||
                    curFrame.origin.y <= 0 || curFrame.origin.y >= winBounds.size.height) {
                    floatingButtonView.frame = CGRectMake(winBounds.size.width - curFrame.size.width - 20.0,
                                                          winBounds.size.height - curFrame.size.height - 120.0,
                                                          curFrame.size.width,
                                                          curFrame.size.height);
                }
            }
            
            if (floatingButtonView.superview != activeWin) {
                [activeWin addSubview:floatingButtonView];
            }
            [activeWin bringSubviewToFront:floatingButtonView];
            floatingButtonView.hidden = NO;
            floatingButtonView.alpha = 1.0;
            [floatingButtonView.subviews.firstObject setNeedsDisplay];
        };

        attachToWindow();
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), attachToWindow);
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.8 * NSEC_PER_SEC)), dispatch_get_main_queue(), attachToWindow);
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), attachToWindow);

        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(hideFloatingButton:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (floatingButtonView != nil) {
            [UIView animateWithDuration:0.15 animations:^{
                floatingButtonView.alpha = 0.0;
            } completion:^(BOOL finished) {
                floatingButtonView.hidden = YES;
            }];
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(setFloatingButtonBadge:(BOOL)hasBadge
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (floatingButtonView != nil) {
            [floatingButtonView updateBadgeVisible:hasBadge];
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(setFloatingButtonPosition:(double)x y:(double)y
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (floatingButtonView != nil && floatingButtonView.superview != nil) {
            floatingButtonView.frame = CGRectMake(x, y, floatingButtonView.frame.size.width, floatingButtonView.frame.size.height);
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(startFpsMonitoring:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self->displayLink == nil) {
            self->lastFpsTimestamp = 0;
            self->frameCount = 0;
            self->currentCalculatedFps = 60.0;
            self->displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleFpsTick:)];
            [self->displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
        }
        resolve(@(YES));
    });
}

- (void)handleFpsTick:(CADisplayLink *)link {
    if (self->lastFpsTimestamp == 0) {
        self->lastFpsTimestamp = link.timestamp;
        return;
    }
    self->frameCount++;
    CFTimeInterval elapsed = link.timestamp - self->lastFpsTimestamp;
    if (elapsed >= 0.5) {
        self->currentCalculatedFps = (double)self->frameCount / elapsed;
        self->frameCount = 0;
        self->lastFpsTimestamp = link.timestamp;
    }
}

RCT_EXPORT_METHOD(stopFpsMonitoring:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self->displayLink != nil) {
            [self->displayLink invalidate];
            self->displayLink = nil;
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(getFpsMetrics:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    [dict setObject:@(self->currentCalculatedFps > 0 ? self->currentCalculatedFps : 60.0) forKey:@"fps"];
    [dict setObject:@(60.0) forKey:@"targetFps"];
    resolve(dict);
}

RCT_EXPORT_METHOD(getNativeStorageItem:(NSString *)key
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSString *prefKey = [NSString stringWithFormat:@"inapp_inspector_%@", key ?: @""];
    NSString *val = [[NSUserDefaults standardUserDefaults] stringForKey:prefKey];
    resolve(val ?: [NSNull null]);
}

RCT_EXPORT_METHOD(setNativeStorageItem:(NSString *)key
                  value:(NSString *)value
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    NSString *prefKey = [NSString stringWithFormat:@"inapp_inspector_%@", key ?: @""];
    if (value == nil || [value isKindOfClass:[NSNull class]]) {
        [[NSUserDefaults standardUserDefaults] removeObjectForKey:prefKey];
    } else {
        [[NSUserDefaults standardUserDefaults] setObject:value forKey:prefKey];
    }
    [[NSUserDefaults standardUserDefaults] synchronize];
    resolve(@(YES));
}

RCT_EXPORT_METHOD(triggerHaptic:(NSString *)style
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (@available(iOS 10.0, *)) {
            NSString *s = [style lowercaseString] ?: @"light";
            if ([s isEqualToString:@"medium"]) {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
                [gen prepare];
                [gen impactOccurred];
            } else if ([s isEqualToString:@"heavy"]) {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleHeavy];
                [gen prepare];
                [gen impactOccurred];
            } else if ([s isEqualToString:@"success"]) {
                UINotificationFeedbackGenerator *gen = [[UINotificationFeedbackGenerator alloc] init];
                [gen prepare];
                [gen notificationOccurred:UINotificationFeedbackTypeSuccess];
            } else if ([s isEqualToString:@"warning"]) {
                UINotificationFeedbackGenerator *gen = [[UINotificationFeedbackGenerator alloc] init];
                [gen prepare];
                [gen notificationOccurred:UINotificationFeedbackTypeWarning];
            } else if ([s isEqualToString:@"error"]) {
                UINotificationFeedbackGenerator *gen = [[UINotificationFeedbackGenerator alloc] init];
                [gen prepare];
                [gen notificationOccurred:UINotificationFeedbackTypeError];
            } else {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
                [gen prepare];
                [gen impactOccurred];
            }
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName) {
    [super addListener:eventName];
}

RCT_EXPORT_METHOD(removeListeners:(double)count) {
    [super removeListeners:count];
}

RCT_EXPORT_METHOD(getNativeSystemMetrics:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(self->_metricsQueue, ^{
        NSMutableDictionary *dict = [NSMutableDictionary dictionary];
        
        if (@available(iOS 11.0, *)) {
            NSProcessInfoThermalState thermal = [[NSProcessInfo processInfo] thermalState];
            NSString *thermalStr = @"nominal";
            if (thermal == NSProcessInfoThermalStateFair) thermalStr = @"fair";
            else if (thermal == NSProcessInfoThermalStateSerious) thermalStr = @"serious";
            else if (thermal == NSProcessInfoThermalStateCritical) thermalStr = @"critical";
            [dict setObject:thermalStr forKey:@"thermalState"];
        } else {
            [dict setObject:@"nominal" forKey:@"thermalState"];
        }
        
        struct mach_task_basic_info info;
        mach_msg_type_number_t size = MACH_TASK_BASIC_INFO_COUNT;
        kern_return_t kerr = task_info(mach_task_self(), MACH_TASK_BASIC_INFO, (task_info_t)&info, &size);
        if (kerr == KERN_SUCCESS) {
            double ramMB = (double)info.resident_size / (1024.0 * 1024.0);
            [dict setObject:@(ramMB) forKey:@"residentRamMb"];
        }
        
        [dict setObject:@(self->currentCalculatedFps > 0 ? self->currentCalculatedFps : 60.0) forKey:@"fps"];
        [dict setObject:@([[NSProcessInfo processInfo] activeProcessorCount]) forKey:@"activeCpuCores"];
        [dict setObject:@([[NSProcessInfo processInfo] physicalMemory] / (1024.0 * 1024.0)) forKey:@"totalPhysicalRamMb"];

        resolve(dict);
    });
}

RCT_EXPORT_METHOD(pushNativeLogRecord:(NSString *)pageKey
                  jsonPayload:(NSString *)jsonPayload
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    if (!jsonPayload || jsonPayload.length == 0) {
        resolve(@(NO));
        return;
    }
    
    dispatch_queue_t targetQueue = self->_networkQueue;
    NSMutableArray *targetStore = self->_nativeNetworkLogs;
    if ([pageKey isEqualToString:@"logs"]) {
        targetQueue = self->_consoleQueue;
        targetStore = self->_nativeConsoleLogs;
    } else if ([pageKey isEqualToString:@"analytics"]) {
        targetQueue = self->_analyticsQueue;
        targetStore = self->_nativeAnalyticsEvents;
    } else if ([pageKey isEqualToString:@"crash"]) {
        targetQueue = self->_crashQueue;
        targetStore = self->_nativeCrashRecords;
    }
    
    dispatch_async(targetQueue, ^{
        NSData *data = [jsonPayload dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *dict = nil;
        if (data) {
            dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        }
        
        id itemId = dict ? dict[@"id"] : nil;
        BOOL updated = NO;
        
        if (itemId != nil) {
            NSString *idPattern = [NSString stringWithFormat:@"\"id\":%@", itemId];
            NSString *idStrPattern = [NSString stringWithFormat:@"\"id\":\"%@\"", itemId];
            for (NSUInteger i = 0; i < targetStore.count; i++) {
                NSString *existingJson = targetStore[i];
                if ([existingJson containsString:idPattern] || [existingJson containsString:idStrPattern]) {
                    [targetStore replaceObjectAtIndex:i withObject:jsonPayload];
                    updated = YES;
                    break;
                }
            }
        }
        
        if (!updated) {
            [targetStore insertObject:jsonPayload atIndex:0];
            if (targetStore.count > 2000) {
                [targetStore removeLastObject];
            }
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(getNativeCachedPage:(NSString *)pageKey
                  offset:(double)offset
                  limit:(double)limit
                  query:(NSString *)query
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_queue_t targetQueue = self->_networkQueue;
    NSMutableArray *targetStore = self->_nativeNetworkLogs;
    if ([pageKey isEqualToString:@"logs"]) {
        targetQueue = self->_consoleQueue;
        targetStore = self->_nativeConsoleLogs;
    } else if ([pageKey isEqualToString:@"analytics"]) {
        targetQueue = self->_analyticsQueue;
        targetStore = self->_nativeAnalyticsEvents;
    } else if ([pageKey isEqualToString:@"crash"]) {
        targetQueue = self->_crashQueue;
        targetStore = self->_nativeCrashRecords;
    }
    
    dispatch_async(targetQueue, ^{
        NSMutableArray *results = [NSMutableArray array];
        NSString *cleanQuery = query ? [query stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]].lowercaseString : @"";
        
        NSInteger startIndex = MAX(0, offset);
        NSInteger itemsCollected = 0;
        NSInteger actualLimit = limit > 0 ? limit : 50;
        
        for (NSInteger i = startIndex; i < targetStore.count && itemsCollected < actualLimit; i++) {
            NSString *itemJson = targetStore[i];
            if (cleanQuery.length > 0) {
                if ([itemJson.lowercaseString containsString:cleanQuery]) {
                    [results addObject:itemJson];
                    itemsCollected++;
                }
            } else {
                [results addObject:itemJson];
                itemsCollected++;
            }
        }
        
        NSError *error = nil;
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:@{
            @"pageKey": pageKey ?: @"apis",
            @"total": @(targetStore.count),
            @"offset": @(offset),
            @"items": results
        } options:0 error:&error];
        
        if (error || !jsonData) {
            resolve(@"{\"items\":[],\"total\":0}");
        } else {
            NSString *jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            resolve(jsonStr);
        }
    });
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeNetworkInspectorSpecJSI>(params);
}
#endif

@end
