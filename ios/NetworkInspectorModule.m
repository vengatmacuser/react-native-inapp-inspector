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

@interface InAppInspectorFloatingView ()
@property (nonatomic, assign) CGPoint touchDownPoint;
@property (nonatomic, assign) CGPoint initialCenter;
@property (nonatomic, assign) NSTimeInterval touchDownTime;
@property (nonatomic, assign) BOOL isDragging;
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
        
        // Native drawn Inspector Owl icon (Enhanced & Larger)
        CGFloat iconSize = frame.size.width * 0.94;
        CGFloat iconOffset = (frame.size.width - iconSize) / 2.0;
        InAppInspectorOwlView *owlView = [[InAppInspectorOwlView alloc] initWithFrame:CGRectMake(iconOffset, iconOffset, iconSize, iconSize)];
        owlView.userInteractionEnabled = NO;
        [self addSubview:owlView];
    }
    return self;
}

- (void)updateBadgeVisible:(BOOL)visible {
    // Active badge dot removed
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    if (!touch) return;
    
    if (self.superview) {
        [self.superview bringSubviewToFront:self];
    }
    
    self.touchDownPoint = [touch locationInView:self.window];
    self.initialCenter = self.center;
    self.touchDownTime = CACurrentMediaTime();
    self.isDragging = NO;
    
    [UIView animateWithDuration:0.08 animations:^{
        self.transform = CGAffineTransformMakeScale(0.92, 0.92);
    }];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    UIView *superview = self.superview;
    if (!touch || !superview) return;
    
    CGPoint currentPoint = [touch locationInView:self.window];
    CGFloat dx = currentPoint.x - self.touchDownPoint.x;
    CGFloat dy = currentPoint.y - self.touchDownPoint.y;
    CGFloat distance = hypot(dx, dy);
    
    if (!self.isDragging && distance > 14.0) {
        self.isDragging = YES;
    }
    
    if (self.isDragging) {
        CGFloat halfW = self.bounds.size.width / 2.0;
        CGFloat halfH = self.bounds.size.height / 2.0;
        CGFloat minX = halfW + 10.0;
        CGFloat maxX = superview.bounds.size.width - halfW - 10.0;
        CGFloat minY = halfH + 44.0;
        CGFloat maxY = superview.bounds.size.height - halfH - 44.0;
        
        CGPoint newCenter = CGPointMake(self.initialCenter.x + dx, self.initialCenter.y + dy);
        newCenter.x = MAX(minX, MIN(maxX, newCenter.x));
        newCenter.y = MAX(minY, MIN(maxY, newCenter.y));
        self.center = newCenter;
    }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    UIView *superview = self.superview;
    
    [UIView animateWithDuration:0.12 animations:^{
        self.transform = CGAffineTransformIdentity;
    }];
    
    if (!touch || !superview) return;
    
    CGPoint currentPoint = [touch locationInView:self.window];
    CGFloat dx = currentPoint.x - self.touchDownPoint.x;
    CGFloat dy = currentPoint.y - self.touchDownPoint.y;
    CGFloat distance = hypot(dx, dy);
    NSTimeInterval elapsed = CACurrentMediaTime() - self.touchDownTime;
    
    if (!self.isDragging && distance < 24.0 && elapsed < 0.85) {
        if (self.onTapBlock) {
            self.onTapBlock();
        }
    } else if (self.isDragging) {
        CGFloat halfW = self.bounds.size.width / 2.0;
        CGFloat minX = halfW + 10.0;
        CGFloat maxX = superview.bounds.size.width - halfW - 10.0;
        CGFloat targetX = (self.center.x < superview.bounds.size.width / 2.0) ? minX : maxX;
        [UIView animateWithDuration:0.25 delay:0 usingSpringWithDamping:0.75 initialSpringVelocity:0.5 options:UIViewAnimationOptionCurveEaseOut animations:^{
            self.center = CGPointMake(targetX, self.center.y);
        } completion:nil];
    }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    [UIView animateWithDuration:0.12 animations:^{
        self.transform = CGAffineTransformIdentity;
    }];
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

- (void)handleMotionShakeNotification:(NSNotification *)notification {
    if (hasListeners) {
        [self sendEventWithName:@"onDeviceShake" body:@{}];
    }
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

RCT_EXPORT_METHOD(getDeviceMetrics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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

    resolve(metrics);
}

RCT_EXPORT_METHOD(showFloatingButton:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIWindow *targetWindow = nil;
        if (@available(iOS 13.0, *)) {
            for (UIWindowScene *scene in [UIApplication sharedApplication].connectedScenes) {
                if (scene.activationState == UISceneActivationStateForegroundActive && [scene isKindOfClass:[UIWindowScene class]]) {
                    for (UIWindow *w in scene.windows) {
                        if (w.isKeyWindow) {
                            targetWindow = w;
                            break;
                        }
                    }
                }
                if (targetWindow) break;
            }
        }
        if (!targetWindow) {
            targetWindow = [UIApplication sharedApplication].keyWindow;
            if (!targetWindow && [UIApplication sharedApplication].windows.count > 0) {
                targetWindow = [UIApplication sharedApplication].windows.firstObject;
            }
        }

        if (!targetWindow) {
            resolve(@(NO));
            return;
        }

        CGFloat size = 64.0;
        if (options && options[@"size"]) {
            size = [options[@"size"] doubleValue];
        }

        CGFloat initialX = targetWindow.bounds.size.width - size - 20.0;
        CGFloat initialY = targetWindow.bounds.size.height - size - 110.0;
        if (options && options[@"x"]) {
            initialX = [options[@"x"] doubleValue];
        }
        if (options && options[@"y"]) {
            initialY = [options[@"y"] doubleValue];
        }

        if (floatingButtonView == nil) {
            floatingButtonView = [[InAppInspectorFloatingView alloc] initWithFrame:CGRectMake(initialX, initialY, size, size)];
            __weak NetworkInspectorModule *weakSelf = self;
            floatingButtonView.onTapBlock = ^{
                NetworkInspectorModule *strongSelf = weakSelf ?: sharedInstance;
                if (strongSelf) {
                    [strongSelf sendEventWithName:@"onFloatingButtonPress" body:@{}];
                }
            };
        }

        if (floatingButtonView.superview == nil) {
            [targetWindow addSubview:floatingButtonView];
        } else {
            [targetWindow bringSubviewToFront:floatingButtonView];
        }
        
        floatingButtonView.hidden = NO;
        floatingButtonView.alpha = 0.0;
        [UIView animateWithDuration:0.2 animations:^{
            floatingButtonView.alpha = 1.0;
        }];

        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(hideFloatingButton:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (floatingButtonView != nil) {
            [floatingButtonView updateBadgeVisible:hasBadge];
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(setFloatingButtonPosition:(double)x y:(double)y
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (floatingButtonView != nil && floatingButtonView.superview != nil) {
            floatingButtonView.frame = CGRectMake(x, y, floatingButtonView.frame.size.width, floatingButtonView.frame.size.height);
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(startFpsMonitoring:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self->displayLink != nil) {
            [self->displayLink invalidate];
            self->displayLink = nil;
        }
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(getFpsMetrics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    [dict setObject:@(self->currentCalculatedFps > 0 ? self->currentCalculatedFps : 60.0) forKey:@"fps"];
    [dict setObject:@(60.0) forKey:@"targetFps"];
    resolve(dict);
}

RCT_EXPORT_METHOD(getNativeStorageItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *prefKey = [NSString stringWithFormat:@"inapp_inspector_%@", key ?: @""];
    NSString *val = [[NSUserDefaults standardUserDefaults] stringForKey:prefKey];
    resolve(val ?: [NSNull null]);
}

RCT_EXPORT_METHOD(setNativeStorageItem:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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

RCT_EXPORT_METHOD(getNativeSystemMetrics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
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
                  offset:(NSInteger)offset
                  limit:(NSInteger)limit
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
