#import "NetworkInspectorModule.h"
#import <execinfo.h>
#import <signal.h>
#import <objc/runtime.h>
#import <unistd.h>
#import <ReplayKit/ReplayKit.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/MobileCoreServices.h>

static NetworkInspectorModule *sharedInstance = nil;
static NSUncaughtExceptionHandler *previousUncaughtExceptionHandler = NULL;
static BOOL g_floatingButtonPressed = NO;


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
static BOOL g_floatingButtonDesiredVisible = NO;

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

    // Give the crash event a brief window to emit (up to 3 seconds),
    // then delegate to the previous handler instead of freezing the UI forever.
    // The old infinite-runloop approach permanently froze the main thread on any
    // exception (including Fabric view recycling assertions), causing blank screens.
    CFRunLoopRef runLoop = CFRunLoopGetCurrent();
    CFArrayRef allModes = CFRunLoopCopyAllModes(runLoop);
    NSTimeInterval deadline = [NSDate timeIntervalSinceReferenceDate] + 3.0;
    while ([NSDate timeIntervalSinceReferenceDate] < deadline) {
        for (NSString *mode in (__bridge NSArray *)allModes) {
            CFRunLoopRunInMode((CFStringRef)mode, 0.001, false);
        }
    }
    if (allModes) {
        CFRelease(allModes);
    }

    // Delegate to the previous exception handler (e.g. React Native's own handler)
    if (previousUncaughtExceptionHandler) {
        previousUncaughtExceptionHandler(exception);
    }
}

// ─── Fabric View Recycle Safeguard ───────────────────────────────────────────
// Custom NSAssertionHandler that catches the specific Fabric view recycling
// assertion ('Attempt to recycle a mounted view') and logs it as a warning
// instead of crashing. This prevents third-party native views (like
// BVLinearGradient from react-native-linear-gradient) from causing fatal
// assertion failures when Fabric's view recycler encounters views whose
// superview is still attached during conditional unmounting.

@interface InAppInspectorAssertionHandler : NSAssertionHandler
@property (nonatomic, strong) NSAssertionHandler *previousHandler;
@end

@implementation InAppInspectorAssertionHandler

+ (void)install {
    NSThread *mainThread = [NSThread mainThread];
    NSMutableDictionary *threadDict = [mainThread threadDictionary];
    NSAssertionHandler *current = threadDict[NSAssertionHandlerKey];

    InAppInspectorAssertionHandler *handler = [[InAppInspectorAssertionHandler alloc] init];
    handler.previousHandler = current;
    threadDict[NSAssertionHandlerKey] = handler;
    NSLog(@"[InAppInspector] Fabric view recycle safeguard (assertion handler) installed");
}

- (void)handleFailureInMethod:(SEL)selector
                       object:(id)object
                         file:(NSString *)fileName
                   lineNumber:(NSInteger)line
                  description:(NSString *)format, ... {
    va_list args;
    va_start(args, format);
    NSString *desc = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Intercept the specific Fabric recycle assertion
    if ([desc containsString:@"Attempt to recycle a mounted view"]) {
        NSLog(@"[InAppInspector] ⚠️ Suppressed Fabric view recycle assertion: %@ (in %@:%ld)",
              desc, fileName, (long)line);
        return; // Suppress — don't crash
    }

    // Forward all other assertions to the previous handler
    if (self.previousHandler) {
        va_start(args, format);
        [self.previousHandler handleFailureInMethod:selector
                                             object:object
                                               file:fileName
                                         lineNumber:line
                                        description:@"%@", desc];
        va_end(args);
    } else {
        // No previous handler — raise as exception (default behavior)
        NSString *reason = [NSString stringWithFormat:
            @"*** Assertion failure in %@, %@:%ld: %@",
            NSStringFromSelector(selector), fileName, (long)line, desc];
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:reason
                                     userInfo:nil];
    }
}

- (void)handleFailureInFunction:(NSString *)functionName
                           file:(NSString *)fileName
                     lineNumber:(NSInteger)line
                    description:(NSString *)format, ... {
    va_list args;
    va_start(args, format);
    NSString *desc = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);

    // Intercept the specific Fabric recycle assertion
    if ([desc containsString:@"Attempt to recycle a mounted view"]) {
        NSLog(@"[InAppInspector] ⚠️ Suppressed Fabric view recycle assertion: %@ (in %@:%ld)",
              desc, fileName, (long)line);
        return; // Suppress — don't crash
    }

    // Forward all other assertions to the previous handler
    if (self.previousHandler) {
        va_start(args, format);
        [self.previousHandler handleFailureInFunction:functionName
                                                 file:fileName
                                           lineNumber:line
                                          description:@"%@", desc];
        va_end(args);
    } else {
        NSString *reason = [NSString stringWithFormat:
            @"*** Assertion failure in %@, %@:%ld: %@",
            functionName, fileName, (long)line, desc];
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:reason
                                     userInfo:nil];
    }
}

@end

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
    AVAssetWriter *_softwareAssetWriter;
    AVAssetWriterInput *_softwareWriterInput;
    AVAssetWriterInputPixelBufferAdaptor *_softwarePixelBufferAdaptor;
    dispatch_source_t _softwareRecordingTimerSource;
    BOOL _isSoftwareRecordingActive;
    NSInteger _softwareFrameIndex;
    NSTimeInterval _softwareRecordingStartTime;
    long long _softwareRecordingTimestamp;
    NSString *_softwareRecordingFilePath;
    NSString *_softwareRecordingThumbnailPath;
    NSInteger _softwareVideoWidth;
    NSInteger _softwareVideoHeight;
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
    if (self.bridge == nil) return;
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

    // Fabric view recycle safeguard: Install a custom NSAssertionHandler on the
    // main thread that catches the specific 'Attempt to recycle a mounted view'
    // assertion from RCTComponentViewRegistry, instead of crashing the app.
    // This is a defense-in-depth approach — the primary fix is on the JS side
    // (using LinearGradient as absolute background, not as a container parent).
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        dispatch_async(dispatch_get_main_queue(), ^{
            [InAppInspectorAssertionHandler install];
        });
    });
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
        g_floatingButtonDesiredVisible = YES;
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
            g_floatingButtonPressed = YES;
            g_floatingButtonDesiredVisible = NO;
            if (floatingButtonView != nil) {
                floatingButtonView.hidden = YES;
                floatingButtonView.alpha = 0.0;
            }
            NetworkInspectorModule *strongSelf = weakSelf ?: sharedInstance;
            if (strongSelf && strongSelf.bridge != nil) {
                [strongSelf safeSendEvent:@"onFloatingButtonPress" body:@{}];
            }
        };

        void (^attachToWindow)(void) = ^{
            if (!g_floatingButtonDesiredVisible) return;
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
        g_floatingButtonDesiredVisible = NO;
        if (floatingButtonView != nil) {
            floatingButtonView.hidden = YES;
            floatingButtonView.alpha = 0.0;
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

RCT_EXPORT_METHOD(checkFloatingButtonPress:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    BOOL pressed = g_floatingButtonPressed;
    g_floatingButtonPressed = NO;
    resolve(@(pressed));
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

#pragma mark - Screen Capture & Video Recording

- (NSString *)getCapturesDirectory {
    NSString *tempDir = NSTemporaryDirectory();
    NSString *capturesDir = [tempDir stringByAppendingPathComponent:@"inspector_captures"];
    BOOL isDir = NO;
    if (![[NSFileManager defaultManager] fileExistsAtPath:capturesDir isDirectory:&isDir]) {
        [[NSFileManager defaultManager] createDirectoryAtPath:capturesDir withIntermediateDirectories:YES attributes:nil error:nil];
    }
    return capturesDir;
}

- (UIWindow *)findActiveKeyWindow {
    UIWindow *foundWindow = nil;
    if (@available(iOS 13.0, *)) {
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *windowScene = (UIWindowScene *)scene;
                for (UIWindow *w in windowScene.windows) {
                    if (w.isKeyWindow) {
                        return w;
                    }
                    if (!foundWindow && !w.hidden && w.alpha > 0.01) {
                        foundWindow = w;
                    }
                }
            }
        }
    }
    if (!foundWindow) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        foundWindow = [UIApplication sharedApplication].keyWindow;
        if (!foundWindow && [UIApplication sharedApplication].windows.count > 0) {
            foundWindow = [UIApplication sharedApplication].windows.firstObject;
        }
#pragma clang diagnostic pop
    }
    return foundWindow;
}

- (UIImage *)captureScreenHierarchyWithScale:(CGFloat)scale {
    // Restrict capture strictly to active foreground app
    if ([UIApplication sharedApplication].applicationState != UIApplicationStateActive) {
        return nil;
    }

    CGRect screenBounds = [UIScreen mainScreen].bounds;
    CGFloat screenScale = [UIScreen mainScreen].scale;
    CGFloat finalScale = screenScale * scale;
    if (finalScale <= 0.0) finalScale = screenScale;

    UIGraphicsBeginImageContextWithOptions(screenBounds.size, NO, finalScale);
    CGContextRef context = UIGraphicsGetCurrentContext();

    NSArray<UIWindow *> *windows = @[];
    if (@available(iOS 13.0, *)) {
        NSMutableArray *allWindows = [NSMutableArray array];
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                [allWindows addObjectsFromArray:((UIWindowScene *)scene).windows];
            }
        }
        windows = allWindows;
    }
    if (windows.count == 0) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        windows = [UIApplication sharedApplication].windows;
#pragma clang diagnostic pop
    }

    NSArray<UIWindow *> *sortedWindows = [windows sortedArrayUsingComparator:^NSComparisonResult(UIWindow *w1, UIWindow *w2) {
        if (w1.windowLevel < w2.windowLevel) return NSOrderedAscending;
        if (w1.windowLevel > w2.windowLevel) return NSOrderedDescending;
        return NSOrderedSame;
    }];

    BOOL drewAny = NO;
    for (UIWindow *w in sortedWindows) {
        if (w.hidden || w.alpha <= 0.01 || w.bounds.size.width <= 0) continue;
        @try {
            BOOL ok = [w drawViewHierarchyInRect:w.bounds afterScreenUpdates:NO];
            if (ok) {
                drewAny = YES;
            } else if (context) {
                [w.layer renderInContext:context];
                drewAny = YES;
            }
        } @catch (NSException *e) {
            if (context) {
                @try {
                    [w.layer renderInContext:context];
                    drewAny = YES;
                } @catch (NSException *ex) {}
            }
        }
    }

    if (!drewAny) {
        UIWindow *fallback = [self findActiveKeyWindow];
        if (fallback && fallback.rootViewController && fallback.rootViewController.view && context) {
            @try {
                [fallback.rootViewController.view.layer renderInContext:context];
            } @catch (NSException *e) {}
        }
    }

    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return image;
}

- (UIImage *)captureWindowImage:(UIWindow *)window scale:(CGFloat)scale {
    return [self captureScreenHierarchyWithScale:scale];
}

- (CVPixelBufferRef)createPixelBufferFromUIImage:(UIImage *)image size:(CGSize)size {
    if (!image) return NULL;
    CGImageRef cgImage = image.CGImage;
    if (!cgImage) return NULL;

    NSDictionary *options = @{
        (id)kCVPixelBufferCGImageCompatibilityKey: @(YES),
        (id)kCVPixelBufferCGBitmapContextCompatibilityKey: @(YES)
    };
    CVPixelBufferRef pxbuffer = NULL;
    CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault,
                                          (size_t)size.width,
                                          (size_t)size.height,
                                          kCVPixelFormatType_32BGRA,
                                          (__bridge CFDictionaryRef)options,
                                          &pxbuffer);
    if (status != kCVReturnSuccess || pxbuffer == NULL) return NULL;

    CVPixelBufferLockBaseAddress(pxbuffer, 0);
    void *pxdata = CVPixelBufferGetBaseAddress(pxbuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pxbuffer);
    CGColorSpaceRef rgbColorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(pxdata,
                                                 (size_t)size.width,
                                                 (size_t)size.height,
                                                 8,
                                                 bytesPerRow,
                                                 rgbColorSpace,
                                                 (CGBitmapInfo)kCGBitmapByteOrder32Little | (CGBitmapInfo)kCGImageAlphaPremultipliedFirst);
    if (context) {
        CGContextTranslateCTM(context, 0, size.height);
        CGContextScaleCTM(context, 1.0, -1.0);
        CGContextDrawImage(context, CGRectMake(0, 0, size.width, size.height), cgImage);
        CGContextRelease(context);
    }
    CGColorSpaceRelease(rgbColorSpace);
    CVPixelBufferUnlockBaseAddress(pxbuffer, 0);
    return pxbuffer;
}

- (void)startSoftwareRecordingWithOptions:(NSDictionary *)options
                                  resolve:(RCTPromiseResolveBlock)resolve
                                   reject:(RCTPromiseRejectBlock)reject {
    dispatch_async(dispatch_get_main_queue(), ^{
        CGRect bounds = [UIScreen mainScreen].bounds;
        CGFloat screenScale = [UIScreen mainScreen].scale;
        double scaleParam = [options[@"scale"] doubleValue];
        if (scaleParam <= 0.0 || scaleParam > 1.0) {
            scaleParam = 0.5;
        }

        NSInteger width = ((NSInteger)(bounds.size.width * screenScale * scaleParam) / 2) * 2;
        NSInteger height = ((NSInteger)(bounds.size.height * screenScale * scaleParam) / 2) * 2;
        if (width <= 0) width = 360;
        if (height <= 0) height = 640;

        CGSize videoSize = CGSizeMake(width, height);
        long long timestamp = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
        self->_softwareRecordingTimestamp = timestamp;
        NSString *filename = [NSString stringWithFormat:@"video_%lld.mp4", timestamp];
        NSString *filePath = [[self getCapturesDirectory] stringByAppendingPathComponent:filename];
        NSURL *outputUrl = [NSURL fileURLWithPath:filePath];

        NSError *error = nil;
        self->_softwareAssetWriter = [AVAssetWriter assetWriterWithURL:outputUrl fileType:AVFileTypeMPEG4 error:&error];
        if (error || !self->_softwareAssetWriter) {
            reject(@"RECORDER_ERROR", error.localizedDescription ?: @"Failed to initialize AVAssetWriter", error);
            return;
        }

        NSDictionary *videoSettings = @{
            AVVideoCodecKey: AVVideoCodecTypeH264,
            AVVideoWidthKey: @(videoSize.width),
            AVVideoHeightKey: @(videoSize.height),
        };

        self->_softwareWriterInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:videoSettings];
        self->_softwareWriterInput.expectsMediaDataInRealTime = YES;

        NSDictionary *sourcePixelBufferAttributes = @{
            (id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
            (id)kCVPixelBufferWidthKey: @(videoSize.width),
            (id)kCVPixelBufferHeightKey: @(videoSize.height)
        };

        self->_softwarePixelBufferAdaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:self->_softwareWriterInput sourcePixelBufferAttributes:sourcePixelBufferAttributes];

        if ([self->_softwareAssetWriter canAddInput:self->_softwareWriterInput]) {
            [self->_softwareAssetWriter addInput:self->_softwareWriterInput];
        }

        [self->_softwareAssetWriter startWriting];
        [self->_softwareAssetWriter startSessionAtSourceTime:kCMTimeZero];

        self->_isSoftwareRecordingActive = YES;
        self->_softwareFrameIndex = 0;
        self->_softwareRecordingStartTime = [[NSDate date] timeIntervalSince1970];
        self->_softwareRecordingFilePath = filePath;
        self->_softwareVideoWidth = width;
        self->_softwareVideoHeight = height;

        double fps = [options[@"fps"] doubleValue];
        if (fps <= 0.0 || fps > 30.0) fps = 15.0;
        double frameInterval = 1.0 / fps;

        // Immediately capture frame 0 & save thumbnail
        UIImage *firstImg = [self captureScreenHierarchyWithScale:(CGFloat)scaleParam];
        if (firstImg) {
            NSData *thumbData = UIImageJPEGRepresentation(firstImg, 0.8);
            if (thumbData) {
                NSString *thumbFilename = [NSString stringWithFormat:@"thumb_%lld.jpg", timestamp];
                NSString *thumbFilePath = [[self getCapturesDirectory] stringByAppendingPathComponent:thumbFilename];
                [thumbData writeToFile:thumbFilePath atomically:YES];
                self->_softwareRecordingThumbnailPath = thumbFilePath;
            }

            if (self->_softwareWriterInput.isReadyForMoreMediaData) {
                CVPixelBufferRef buffer = [self createPixelBufferFromUIImage:firstImg size:videoSize];
                if (buffer) {
                    [self->_softwarePixelBufferAdaptor appendPixelBuffer:buffer withPresentationTime:kCMTimeZero];
                    CVPixelBufferRelease(buffer);
                    self->_softwareFrameIndex = 1;
                }
            }
        }

        dispatch_queue_t queue = dispatch_queue_create("com.inappinspector.recording", DISPATCH_QUEUE_SERIAL);
        self->_softwareRecordingTimerSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
        dispatch_source_set_timer(self->_softwareRecordingTimerSource, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(frameInterval * NSEC_PER_SEC)), (uint64_t)(frameInterval * NSEC_PER_SEC), (uint64_t)(frameInterval * 0.1 * NSEC_PER_SEC));

        __weak NetworkInspectorModule *weakSelf = self;
        dispatch_source_set_event_handler(self->_softwareRecordingTimerSource, ^{
            NetworkInspectorModule *strongSelf = weakSelf;
            if (!strongSelf || !strongSelf->_isSoftwareRecordingActive) return;

            dispatch_sync(dispatch_get_main_queue(), ^{
                if (!strongSelf || !strongSelf->_isSoftwareRecordingActive) return;
                if (!strongSelf->_softwareAssetWriter || strongSelf->_softwareAssetWriter.status != AVAssetWriterStatusWriting) return;

                UIImage *frameImg = [strongSelf captureScreenHierarchyWithScale:(CGFloat)scaleParam];
                if (frameImg && strongSelf->_softwareWriterInput.isReadyForMoreMediaData) {
                    CVPixelBufferRef buffer = [strongSelf createPixelBufferFromUIImage:frameImg size:videoSize];
                    if (buffer) {
                        CMTime presentTime = CMTimeMake((int64_t)(strongSelf->_softwareFrameIndex * 1000 / fps), 1000);
                        [strongSelf->_softwarePixelBufferAdaptor appendPixelBuffer:buffer withPresentationTime:presentTime];
                        CVPixelBufferRelease(buffer);
                        strongSelf->_softwareFrameIndex++;
                    }
                }
            });
        });

        dispatch_resume(self->_softwareRecordingTimerSource);
        resolve(@(YES));
    });
}

RCT_EXPORT_METHOD(takeScreenshot:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            double scaleParam = [options[@"scale"] doubleValue];
            if (scaleParam <= 0.0 || scaleParam > 1.0) {
                scaleParam = 1.0;
            }

            UIImage *image = [self captureScreenHierarchyWithScale:(CGFloat)scaleParam];
            if (!image) {
                reject(@"SCREENSHOT_ERROR", @"Failed to render window hierarchy to image context", nil);
                return;
            }

            NSString *format = [options[@"format"] isKindOfClass:[NSString class]] ? [options[@"format"] lowercaseString] : @"png";
            double quality = [options[@"quality"] doubleValue];
            if (quality <= 0.0 || quality > 1.0) {
                quality = 0.9;
            }

            NSData *data = nil;
            NSString *ext = @"png";
            if ([format isEqualToString:@"jpeg"] || [format isEqualToString:@"jpg"]) {
                data = UIImageJPEGRepresentation(image, quality);
                ext = @"jpg";
                format = @"jpeg";
            } else if ([format isEqualToString:@"webp"]) {
                data = UIImageJPEGRepresentation(image, quality);
                ext = @"webp";
                format = @"webp";
            } else {
                data = UIImagePNGRepresentation(image);
                ext = @"png";
                format = @"png";
            }

            if (!data) {
                reject(@"SCREENSHOT_ERROR", @"Failed to encode image data", nil);
                return;
            }

            long long timestamp = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
            NSString *filename = [NSString stringWithFormat:@"screenshot_%lld.%@", timestamp, ext];
            NSString *filePath = [[self getCapturesDirectory] stringByAppendingPathComponent:filename];

            [data writeToFile:filePath atomically:YES];

            BOOL includeBase64 = [options[@"includeBase64"] boolValue];
            NSString *base64Str = includeBase64 ? [data base64EncodedStringWithOptions:0] : @"";

            NSDictionary *result = @{
                @"uri": [NSURL fileURLWithPath:filePath].absoluteString,
                @"format": format,
                @"width": @((NSInteger)(image.size.width * image.scale)),
                @"height": @((NSInteger)(image.size.height * image.scale)),
                @"sizeBytes": @(data.length),
                @"timestamp": @(timestamp),
                @"base64": base64Str
            };
            resolve(result);
        } @catch (NSException *exception) {
            reject(@"SCREENSHOT_ERROR", exception.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(startVideoRecording:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    if (self->_isSoftwareRecordingActive) {
        resolve(@(YES));
        return;
    }

    [self startSoftwareRecordingWithOptions:options resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(stopVideoRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    if (!self->_isSoftwareRecordingActive) {
        resolve([NSNull null]);
        return;
    }

    self->_isSoftwareRecordingActive = NO;
    if (self->_softwareRecordingTimerSource) {
        dispatch_source_cancel(self->_softwareRecordingTimerSource);
        self->_softwareRecordingTimerSource = nil;
    }

    [self->_softwareWriterInput markAsFinished];
    NSString *filePath = self->_softwareRecordingFilePath;
    NSString *thumbPath = self->_softwareRecordingThumbnailPath;
    NSTimeInterval duration = [[NSDate date] timeIntervalSince1970] - self->_softwareRecordingStartTime;
    long long timestamp = self->_softwareRecordingTimestamp > 0 ? self->_softwareRecordingTimestamp : (long long)(self->_softwareRecordingStartTime * 1000.0);
    NSInteger vidWidth = self->_softwareVideoWidth > 0 ? self->_softwareVideoWidth : 720;
    NSInteger vidHeight = self->_softwareVideoHeight > 0 ? self->_softwareVideoHeight : 1280;

    [self->_softwareAssetWriter finishWritingWithCompletionHandler:^{
        self->_softwareAssetWriter = nil;
        self->_softwareWriterInput = nil;
        self->_softwarePixelBufferAdaptor = nil;
        self->_softwareRecordingThumbnailPath = nil;

        unsigned long long fileSize = 0;
        NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:nil];
        if (attrs) {
            fileSize = [attrs fileSize];
        }

        NSMutableDictionary *result = [NSMutableDictionary dictionaryWithDictionary:@{
            @"uri": [NSURL fileURLWithPath:filePath].absoluteString,
            @"format": @"mp4",
            @"durationMs": @(MAX(500.0, duration * 1000.0)),
            @"hasAudio": @(NO),
            @"width": @(vidWidth),
            @"height": @(vidHeight),
            @"sizeBytes": @(fileSize),
            @"timestamp": @(timestamp)
        }];

        if (thumbPath && [[NSFileManager defaultManager] fileExistsAtPath:thumbPath]) {
            result[@"thumbnailUri"] = [NSURL fileURLWithPath:thumbPath].absoluteString;
        }

        resolve(result);
    }];
}

RCT_EXPORT_METHOD(isRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve(@(self->_isSoftwareRecordingActive));
}

RCT_EXPORT_METHOD(playVideo:(NSString *)videoUri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            if (!videoUri || videoUri.length == 0) {
                reject(@"PLAY_ERROR", @"Invalid video URI", nil);
                return;
            }
            NSURL *url = [NSURL URLWithString:videoUri];
            if (!url || !url.scheme) {
                url = [NSURL fileURLWithPath:videoUri];
            }

            AVPlayer *player = [AVPlayer playerWithURL:url];
            AVPlayerViewController *playerController = [[AVPlayerViewController alloc] init];
            playerController.player = player;
            playerController.showsPlaybackControls = YES;
            playerController.modalPresentationStyle = UIModalPresentationFullScreen;

            UIWindow *keyWindow = [self findActiveKeyWindow];
            UIViewController *rootVC = keyWindow.rootViewController;
            if (!rootVC) {
                rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;
            }
            while (rootVC.presentedViewController) {
                rootVC = rootVC.presentedViewController;
            }

            if (rootVC) {
                [rootVC presentViewController:playerController animated:YES completion:^{
                    [player play];
                    resolve(@(YES));
                }];
            } else {
                reject(@"PLAY_ERROR", @"Unable to find view controller to present video player", nil);
            }
        } @catch (NSException *ex) {
            reject(@"PLAY_ERROR", ex.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(convertToGif:(NSString *)videoUri
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSURL *videoUrl = [NSURL URLWithString:videoUri];
            if (!videoUrl || !videoUrl.scheme) {
                videoUrl = [NSURL fileURLWithPath:videoUri];
            }

            AVURLAsset *asset = [AVURLAsset URLAssetWithURL:videoUrl options:nil];
            NSError *error = nil;
            AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:asset error:&error];
            if (error || !reader) {
                reject(@"GIF_ERROR", @"Unable to initialize asset reader for video", error);
                return;
            }

            NSArray<AVAssetTrack *> *tracks = [asset tracksWithMediaType:AVMediaTypeVideo];
            if (tracks.count == 0) {
                reject(@"GIF_ERROR", @"No video track found in media asset", nil);
                return;
            }
            AVAssetTrack *videoTrack = tracks.firstObject;

            NSDictionary *outputSettings = @{
                (id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA)
            };
            AVAssetReaderTrackOutput *readerOutput = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:videoTrack outputSettings:outputSettings];
            [reader addOutput:readerOutput];
            [reader startReading];

            long long timestamp = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
            NSString *filename = [NSString stringWithFormat:@"anim_%lld.gif", timestamp];
            NSString *filePath = [[self getCapturesDirectory] stringByAppendingPathComponent:filename];
            NSURL *gifUrl = [NSURL fileURLWithPath:filePath];

            CGImageDestinationRef destination = CGImageDestinationCreateWithURL((__bridge CFURLRef)gifUrl, kUTTypeGIF, 0, NULL);
            if (!destination) {
                reject(@"GIF_ERROR", @"Failed to create GIF image destination", nil);
                return;
            }

            NSDictionary *gifProperties = @{
                (id)kCGImagePropertyGIFDictionary: @{
                    (id)kCGImagePropertyGIFLoopCount: @(0)
                }
            };
            CGImageDestinationSetProperties(destination, (__bridge CFDictionaryRef)gifProperties);

            double targetFps = [options[@"fps"] doubleValue];
            if (targetFps <= 0.0 || targetFps > 30.0) targetFps = 12.0;
            double frameDelay = 1.0 / targetFps;

            NSDictionary *frameProperties = @{
                (id)kCGImagePropertyGIFDictionary: @{
                    (id)kCGImagePropertyGIFDelayTime: @(frameDelay)
                }
            };

            NSInteger frameCount = 0;
            NSInteger skipInterval = (NSInteger)MAX(1, (videoTrack.nominalFrameRate / targetFps));
            NSInteger readIndex = 0;
            CGSize outputSize = videoTrack.naturalSize;

            while (reader.status == AVAssetReaderStatusReading) {
                CMSampleBufferRef sampleBuffer = [readerOutput copyNextSampleBuffer];
                if (!sampleBuffer) break;

                if (readIndex % skipInterval == 0) {
                    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
                    if (pixelBuffer) {
                        CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
                        CIImage *ciImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];
                        CIContext *ciContext = [CIContext contextWithOptions:nil];
                        CGImageRef cgImage = [ciContext createCGImage:ciImage fromRect:ciImage.extent];
                        if (cgImage) {
                            CGImageDestinationAddImage(destination, cgImage, (__bridge CFDictionaryRef)frameProperties);
                            CGImageRelease(cgImage);
                            frameCount++;
                        }
                        CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
                    }
                }
                CFRelease(sampleBuffer);
                readIndex++;
                if (frameCount >= 150) break; // Limit GIF frames for memory safety
            }

            CGImageDestinationFinalize(destination);
            CFRelease(destination);

            unsigned long long gifSize = 0;
            NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:nil];
            if (attrs) gifSize = [attrs fileSize];

            NSDictionary *result = @{
                @"uri": gifUrl.absoluteString,
                @"format": @"gif",
                @"durationMs": @(frameCount * frameDelay * 1000.0),
                @"hasAudio": @(NO),
                @"width": @((NSInteger)outputSize.width),
                @"height": @((NSInteger)outputSize.height),
                @"sizeBytes": @(gifSize),
                @"timestamp": @(timestamp)
            };
            resolve(result);
        } @catch (NSException *ex) {
            reject(@"GIF_ERROR", ex.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(getCapturedMedia:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *dir = [self getCapturesDirectory];
        NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:dir error:nil];
        NSMutableArray *mediaItems = [NSMutableArray array];

        for (NSString *file in (files ?: @[])) {
            // Skip standalone thumbnail files
            if ([file hasPrefix:@"thumb_"]) continue;

            NSString *fullPath = [dir stringByAppendingPathComponent:file];
            NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:fullPath error:nil];
            if (!attrs) continue;

            NSString *ext = [file.pathExtension lowercaseString];
            NSString *type = @"image";
            if ([ext isEqualToString:@"mp4"] || [ext isEqualToString:@"mov"]) {
                type = @"video";
            } else if ([ext isEqualToString:@"gif"]) {
                type = @"gif";
            }

            long long sizeBytes = [attrs fileSize];
            NSDate *modDate = [attrs fileModificationDate];
            long long timestamp = (long long)([modDate timeIntervalSince1970] * 1000.0);

            NSMutableDictionary *item = [NSMutableDictionary dictionaryWithDictionary:@{
                @"id": file,
                @"type": type,
                @"format": ext,
                @"uri": [NSURL fileURLWithPath:fullPath].absoluteString,
                @"filename": file,
                @"sizeBytes": @(sizeBytes),
                @"timestamp": @(timestamp)
            }];

            if ([type isEqualToString:@"video"]) {
                // Check if matching thumbnail exists
                NSString *nameWithoutExt = [file stringByDeletingPathExtension];
                NSString *timestampSuffix = [nameWithoutExt stringByReplacingOccurrencesOfString:@"video_" withString:@""];
                NSString *thumbFile = [NSString stringWithFormat:@"thumb_%@.jpg", timestampSuffix];
                NSString *thumbFullPath = [dir stringByAppendingPathComponent:thumbFile];
                if ([[NSFileManager defaultManager] fileExistsAtPath:thumbFullPath]) {
                    item[@"thumbnailUri"] = [NSURL fileURLWithPath:thumbFullPath].absoluteString;
                } else {
                    @try {
                        NSURL *vidUrl = [NSURL fileURLWithPath:fullPath];
                        AVURLAsset *asset = [[AVURLAsset alloc] initWithURL:vidUrl options:nil];
                        AVAssetImageGenerator *gen = [[AVAssetImageGenerator alloc] initWithAsset:asset];
                        gen.appliesPreferredTrackTransform = YES;
                        gen.requestedTimeToleranceBefore = kCMTimePositiveInfinity;
                        gen.requestedTimeToleranceAfter = kCMTimePositiveInfinity;
                        gen.maximumSize = CGSizeMake(720, 720);
                        CMTime time = kCMTimeZero;
                        NSError *err = nil;
                        CGImageRef imgRef = [gen copyCGImageAtTime:time actualTime:NULL error:&err];
                        if (imgRef) {
                            UIImage *thumbImg = [UIImage imageWithCGImage:imgRef];
                            CGImageRelease(imgRef);
                            NSData *tData = UIImageJPEGRepresentation(thumbImg, 0.85);
                            if (tData) {
                                [tData writeToFile:thumbFullPath atomically:YES];
                                item[@"thumbnailUri"] = [NSURL fileURLWithPath:thumbFullPath].absoluteString;
                            }
                        }
                    } @catch (NSException *e) {}
                }
            }

            [mediaItems addObject:item];
        }

        [mediaItems sortUsingComparator:^NSComparisonResult(id obj1, id obj2) {
            return [obj2[@"timestamp"] compare:obj1[@"timestamp"]];
        }];

        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:mediaItems options:0 error:nil];
        NSString *jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        resolve(jsonStr ?: @"[]");
    });
}

RCT_EXPORT_METHOD(deleteCapturedMedia:(NSString *)uri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSURL *url = [NSURL URLWithString:uri];
            NSString *path = url ? url.path : uri;
            if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
                [[NSFileManager defaultManager] removeItemAtPath:path error:nil];

                // Also remove any related thumbnail
                NSString *filename = [path lastPathComponent];
                if ([filename hasPrefix:@"video_"]) {
                    NSString *nameWithoutExt = [filename stringByDeletingPathExtension];
                    NSString *timestampSuffix = [nameWithoutExt stringByReplacingOccurrencesOfString:@"video_" withString:@""];
                    NSString *thumbFile = [NSString stringWithFormat:@"thumb_%@.jpg", timestampSuffix];
                    NSString *thumbPath = [[path stringByDeletingLastPathComponent] stringByAppendingPathComponent:thumbFile];
                    if ([[NSFileManager defaultManager] fileExistsAtPath:thumbPath]) {
                        [[NSFileManager defaultManager] removeItemAtPath:thumbPath error:nil];
                    }
                }

                resolve(@(YES));
            } else {
                resolve(@(NO));
            }
        } @catch (NSException *ex) {
            resolve(@(NO));
        }
    });
}

RCT_EXPORT_METHOD(clearAllCapturedMedia:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSString *dir = [self getCapturesDirectory];
            NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:dir error:nil];
            for (NSString *file in (files ?: @[])) {
                [[NSFileManager defaultManager] removeItemAtPath:[dir stringByAppendingPathComponent:file] error:nil];
            }
            resolve(@(YES));
        } @catch (NSException *ex) {
            resolve(@(NO));
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

