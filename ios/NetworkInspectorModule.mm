#import "NetworkInspectorModule.h"
#import <execinfo.h>
#import <signal.h>
#import <objc/runtime.h>
#import <objc/message.h>
#import <unistd.h>
#import <ReplayKit/ReplayKit.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <CoreImage/CoreImage.h>
#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <Photos/Photos.h>
#import <PhotosUI/PhotosUI.h>
#if __has_include(<UniformTypeIdentifiers/UniformTypeIdentifiers.h>)
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#endif

static __weak NetworkInspectorModule *sharedInstance = nil;
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

static void NativeExceptionHandler(NSException *exception) {
    if (!exception) return;
    NSArray *callStack = [exception callStackSymbols];
    NSString *stackTrace = [callStack componentsJoinedByString:@"\n"];
    NSString *message = [NSString stringWithFormat:@"%@: %@", [exception name], [exception reason]];

    if (sharedInstance != nil) {
        [sharedInstance emitCrashEventWithMessage:message stackTrace:stackTrace];
    }

    // Save crash record to local cache directory synchronously for persistent debugging
    @try {
        NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        NSString *crashDir = [cacheDir stringByAppendingPathComponent:@"inspector_captures"];
        [[NSFileManager defaultManager] createDirectoryAtPath:crashDir withIntermediateDirectories:YES attributes:nil error:nil];
        NSString *crashFile = [crashDir stringByAppendingPathComponent:@"last_native_crash.json"];
        NSDictionary *crashDict = @{
            @"platform": @"ios",
            @"message": message ?: @"Unknown iOS Exception",
            @"name": [exception name] ?: @"NSException",
            @"reason": [exception reason] ?: @"",
            @"stack": stackTrace ?: @"",
            @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
        };
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:crashDict options:NSJSONWritingPrettyPrinted error:nil];
        [jsonData writeToFile:crashFile atomically:YES];
    } @catch (NSException *e) {}

    // Delegate to previous exception handler (React Native / Crashlytics / default)
    if (previousUncaughtExceptionHandler && previousUncaughtExceptionHandler != &NativeExceptionHandler) {
        previousUncaughtExceptionHandler(exception);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIVE CAMERA ROLL / PHOTO & VIDEO PICKER DELEGATE
// ─────────────────────────────────────────────────────────────────────────────

@interface InAppInspectorPickerDelegate : NSObject <PHPickerViewControllerDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate>
@property (nonatomic, copy) RCTPromiseResolveBlock resolve;
@property (nonatomic, copy) RCTPromiseRejectBlock reject;
@property (nonatomic, copy) NSString *capturesDirectory;
@end

@implementation InAppInspectorPickerDelegate

- (void)picker:(PHPickerViewController *)picker didFinishPicking:(NSArray<PHPickerResult *> *)results API_AVAILABLE(ios(14.0)) {
    [picker dismissViewControllerAnimated:YES completion:nil];
    if (results.count == 0) {
        if (self.resolve) self.resolve([NSNull null]);
        return;
    }

    PHPickerResult *result = results.firstObject;
    NSItemProvider *provider = result.itemProvider;
    long long timestamp = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
    NSString *randomStr = [NSString stringWithFormat:@"%04d", arc4random_uniform(10000)];

    if ([provider hasItemConformingToTypeIdentifier:@"public.movie"]) {
        [provider loadFileRepresentationForTypeIdentifier:@"public.movie" completionHandler:^(NSURL * _Nullable url, NSError * _Nullable error) {
            if (error || !url) {
                if (self.resolve) self.resolve([NSNull null]);
                return;
            }
            NSString *ext = [url.pathExtension lowercaseString];
            if (ext.length == 0) ext = @"mp4";
            NSString *filename = [NSString stringWithFormat:@"rn_iai_%lld_imported_%@.%@", timestamp, randomStr, ext];
            NSString *destPath = [self.capturesDirectory stringByAppendingPathComponent:filename];

            [[NSFileManager defaultManager] removeItemAtPath:destPath error:nil];
            [[NSFileManager defaultManager] copyItemAtURL:url toURL:[NSURL fileURLWithPath:destPath] error:nil];

            NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:destPath error:nil];
            long long sizeBytes = [attrs fileSize];

            NSMutableDictionary *map = [NSMutableDictionary dictionaryWithDictionary:@{
                @"id": filename,
                @"type": @"video",
                @"format": ext,
                @"uri": [NSURL fileURLWithPath:destPath].absoluteString,
                @"filename": filename,
                @"sizeBytes": @(sizeBytes),
                @"timestamp": @(timestamp)
            }];

            @try {
                AVURLAsset *asset = [[AVURLAsset alloc] initWithURL:[NSURL fileURLWithPath:destPath] options:nil];
                AVAssetImageGenerator *gen = [[AVAssetImageGenerator alloc] initWithAsset:asset];
                gen.appliesPreferredTrackTransform = YES;
                CGImageRef cgImage = [gen copyCGImageAtTime:kCMTimeZero actualTime:NULL error:nil];
                if (cgImage) {
                    UIImage *thumbImg = [UIImage imageWithCGImage:cgImage];
                    CGImageRelease(cgImage);
                    NSData *thumbData = UIImageJPEGRepresentation(thumbImg, 0.8);
                    NSString *thumbFile = [NSString stringWithFormat:@"rn_iai_%lld_imported_%@_thumb.jpg", timestamp, randomStr];
                    NSString *thumbPath = [self.capturesDirectory stringByAppendingPathComponent:thumbFile];
                    [thumbData writeToFile:thumbPath atomically:YES];
                    map[@"thumbnailUri"] = [NSURL fileURLWithPath:thumbPath].absoluteString;
                }
            } @catch (id ex) {}

            if (self.resolve) self.resolve(map);
        }];
    } else {
        [provider loadFileRepresentationForTypeIdentifier:@"public.image" completionHandler:^(NSURL * _Nullable url, NSError * _Nullable error) {
            if (url) {
                NSString *ext = [url.pathExtension lowercaseString];
                if (ext.length == 0) ext = @"jpg";
                NSString *type = [ext isEqualToString:@"gif"] ? @"gif" : @"image";
                NSString *filename = [NSString stringWithFormat:@"rn_iai_%lld_imported_%@.%@", timestamp, randomStr, ext];
                NSString *destPath = [self.capturesDirectory stringByAppendingPathComponent:filename];

                [[NSFileManager defaultManager] removeItemAtPath:destPath error:nil];
                [[NSFileManager defaultManager] copyItemAtURL:url toURL:[NSURL fileURLWithPath:destPath] error:nil];
                NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:destPath error:nil];
                long long sizeBytes = [attrs fileSize];

                NSDictionary *map = @{
                    @"id": filename,
                    @"type": type,
                    @"format": ext,
                    @"uri": [NSURL fileURLWithPath:destPath].absoluteString,
                    @"filename": filename,
                    @"sizeBytes": @(sizeBytes),
                    @"timestamp": @(timestamp)
                };
                if (self.resolve) self.resolve(map);
            } else {
                [provider loadObjectOfClass:[UIImage class] completionHandler:^(id<NSItemProviderReading>  _Nullable object, NSError * _Nullable err) {
                    if ([object isKindOfClass:[UIImage class]]) {
                        UIImage *img = (UIImage *)object;
                        NSData *data = UIImageJPEGRepresentation(img, 0.95);
                        NSString *filename = [NSString stringWithFormat:@"rn_iai_%lld_imported_%@.jpg", timestamp, randomStr];
                        NSString *destPath = [self.capturesDirectory stringByAppendingPathComponent:filename];
                        [data writeToFile:destPath atomically:YES];

                        NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:destPath error:nil];
                        long long sizeBytes = [attrs fileSize];

                        NSDictionary *map = @{
                            @"id": filename,
                            @"type": @"image",
                            @"format": @"jpg",
                            @"uri": [NSURL fileURLWithPath:destPath].absoluteString,
                            @"filename": filename,
                            @"sizeBytes": @(sizeBytes),
                            @"timestamp": @(timestamp)
                        };
                        if (self.resolve) self.resolve(map);
                    } else {
                        if (self.resolve) self.resolve([NSNull null]);
                    }
                }];
            }
        }];
    }
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey,id> *)info {
    [picker dismissViewControllerAnimated:YES completion:nil];
    if (self.resolve) self.resolve([NSNull null]);
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker {
    [picker dismissViewControllerAnimated:YES completion:nil];
    if (self.resolve) self.resolve([NSNull null]);
}

@end

static InAppInspectorPickerDelegate *g_pickerDelegate = nil;

// ─────────────────────────────────────────────────────────────────────────────
// SAFE WINDOW & VIEW CONTROLLER HELPERS (iOS 13 - 18+)
// ─────────────────────────────────────────────────────────────────────────────

static BOOL IsInternalSystemWindow(UIWindow *w) {
    if (!w) return YES;
    NSString *className = NSStringFromClass([w class]);
    if ([className hasPrefix:@"_"] ||
        [className containsString:@"Keyboard"] ||
        [className containsString:@"TextEffect"] ||
        [className containsString:@"StatusBar"] ||
        [className containsString:@"InputSet"] ||
        [className containsString:@"TrackingWindow"]) {
        return YES;
    }
    return NO;
}

static UIWindow *GetAppActiveWindow(void) {
    if (@available(iOS 13.0, *)) {
        // Priority 1: Foreground Active Scene with Key Window
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]] && scene.activationState == UISceneActivationStateForegroundActive) {
                UIWindowScene *ws = (UIWindowScene *)scene;
                for (UIWindow *w in ws.windows) {
                    if (w.isKeyWindow && !w.hidden && w.alpha > 0.01 && !IsInternalSystemWindow(w)) {
                        return w;
                    }
                }
                for (UIWindow *w in ws.windows) {
                    if (w.windowLevel == UIWindowLevelNormal && !w.hidden && w.alpha > 0.01 && !IsInternalSystemWindow(w)) {
                        return w;
                    }
                }
            }
        }
        // Priority 2: Any Scene with usable window
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *ws = (UIWindowScene *)scene;
                for (UIWindow *w in ws.windows) {
                    if (!w.hidden && w.alpha > 0.01 && !IsInternalSystemWindow(w) && (w.isKeyWindow || w.windowLevel == UIWindowLevelNormal)) {
                        return w;
                    }
                }
                if (ws.windows.count > 0 && !IsInternalSystemWindow(ws.windows.firstObject)) {
                    return ws.windows.firstObject;
                }
            }
        }
    }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    for (UIWindow *w in [UIApplication sharedApplication].windows) {
        if (!IsInternalSystemWindow(w) && (w.isKeyWindow || w.windowLevel == UIWindowLevelNormal)) {
            return w;
        }
    }
    return [UIApplication sharedApplication].windows.firstObject;
#pragma clang diagnostic pop
}

static UIViewController *FindTopViewControllerFrom(UIViewController *vc) {
    if (!vc) return nil;
    if ([vc isKindOfClass:[UINavigationController class]]) {
        UIViewController *visible = [(UINavigationController *)vc visibleViewController];
        return visible ? FindTopViewControllerFrom(visible) : vc;
    }
    if ([vc isKindOfClass:[UITabBarController class]]) {
        UIViewController *selected = [(UITabBarController *)vc selectedViewController];
        return selected ? FindTopViewControllerFrom(selected) : vc;
    }
    if (vc.presentedViewController && !vc.presentedViewController.isBeingDismissed) {
        return FindTopViewControllerFrom(vc.presentedViewController);
    }
    return vc;
}

static UIViewController *GetTopViewController(void) {
    UIWindow *win = GetAppActiveWindow();
    UIViewController *root = win ? win.rootViewController : nil;
    if (!root) {
        if ([[UIApplication sharedApplication].delegate respondsToSelector:@selector(window)]) {
            root = [UIApplication sharedApplication].delegate.window.rootViewController;
        }
    }
    return root ? FindTopViewControllerFrom(root) : nil;
}

static CGRect GetAppScreenBounds(void) {
    UIWindow *w = GetAppActiveWindow();
    if (w && w.bounds.size.width > 0 && w.bounds.size.height > 0) {
        return w.bounds;
    }
    if (@available(iOS 13.0, *)) {
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *ws = (UIWindowScene *)scene;
                if (ws.coordinateSpace.bounds.size.width > 0 && ws.coordinateSpace.bounds.size.height > 0) {
                    return ws.coordinateSpace.bounds;
                }
            }
        }
    }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    CGRect b = [UIScreen mainScreen].bounds;
    if (b.size.width > 0 && b.size.height > 0) return b;
#pragma clang diagnostic pop
    return CGRectMake(0, 0, 393, 852);
}

static CGFloat GetAppScreenScale(void) {
    UIWindow *w = GetAppActiveWindow();
    if (w && w.screen) {
        return w.screen.scale;
    }
    if (@available(iOS 13.0, *)) {
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                UIWindowScene *ws = (UIWindowScene *)scene;
                if (ws.screen) {
                    return ws.screen.scale;
                }
            }
        }
    }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    return [UIScreen mainScreen].scale > 0 ? [UIScreen mainScreen].scale : 2.0;
#pragma clang diagnostic pop
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

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    if (self->displayLink) {
        [self->displayLink invalidate];
        self->displayLink = nil;
    }
    if (sharedInstance == self) {
        sharedInstance = nil;
    }
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSDictionary *)constantsToExport {
    NSBundle *mainBundle = [NSBundle mainBundle];
    NSString *appName = [mainBundle objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: [mainBundle objectForInfoDictionaryKey:@"CFBundleName"] ?: @"App";
    NSString *appVersion = [mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"1.0";
    NSString *appBuild = [mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"] ?: @"1";
    NSString *appBundleId = [mainBundle bundleIdentifier] ?: @"";
    return @{
        @"appName": appName,
        @"appVersion": appVersion,
        @"appBuild": appBuild,
        @"appBundleId": appBundleId,
        @"appPackageName": appBundleId
    };
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
    @try {
        if (!previousUncaughtExceptionHandler) {
            previousUncaughtExceptionHandler = NSGetUncaughtExceptionHandler();
            NSSetUncaughtExceptionHandler(&NativeExceptionHandler);
        }
        signal(SIGPIPE, SIG_IGN);
    } @catch (NSException *e) {}
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

RCT_EXPORT_METHOD(getLastNativeCrash:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        NSString *crashFile = [[cacheDir stringByAppendingPathComponent:@"inspector_captures"] stringByAppendingPathComponent:@"last_native_crash.json"];
        if ([[NSFileManager defaultManager] fileExistsAtPath:crashFile]) {
            NSData *data = [NSData dataWithContentsOfFile:crashFile];
            if (data) {
                NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
                if (json) {
                    resolve(json);
                    return;
                }
            }
        }
        resolve([NSNull null]);
    } @catch (NSException *e) {
        reject(@"GET_CRASH_ERROR", e.reason, nil);
    }
}

RCT_EXPORT_METHOD(clearLastNativeCrash:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
        NSString *crashFile = [[cacheDir stringByAppendingPathComponent:@"inspector_captures"] stringByAppendingPathComponent:@"last_native_crash.json"];
        if ([[NSFileManager defaultManager] fileExistsAtPath:crashFile]) {
            [[NSFileManager defaultManager] removeItemAtPath:crashFile error:nil];
        }
        resolve(@(YES));
    } @catch (NSException *e) {
        reject(@"CLEAR_CRASH_ERROR", e.reason, nil);
    }
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

RCT_EXPORT_METHOD(showFloatingButton:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        g_floatingButtonDesiredVisible = YES;
        CGRect screenBounds = GetAppScreenBounds();

        CGFloat screenWidth = screenBounds.size.width > 0 ? screenBounds.size.width : 393.0;
        CGFloat screenHeight = screenBounds.size.height > 0 ? screenBounds.size.height : 852.0;

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

/**
 * Generates a filename in the format: rn_iai_{YYYYMMDD_HHmmss_SSS}_{fileType}_{random6}.{ext}
 */
- (NSString *)generateCaptureFilename:(NSString *)fileType ext:(NSString *)ext {
    NSDateFormatter *df = [[NSDateFormatter alloc] init];
    [df setDateFormat:@"yyyyMMdd_HHmmss_SSS"];
    NSString *dateStamp = [df stringFromDate:[NSDate date]];
    NSString *chars = @"abcdefghijklmnopqrstuvwxyz0123456789";
    NSMutableString *random = [NSMutableString stringWithCapacity:6];
    for (int i = 0; i < 6; i++) {
        [random appendFormat:@"%C", [chars characterAtIndex:arc4random_uniform((uint32_t)chars.length)]];
    }
    return [NSString stringWithFormat:@"rn_iai_%@_%@_%@.%@", dateStamp, fileType, random, ext];
}

- (UIWindow *)findActiveKeyWindow {
    return GetAppActiveWindow();
}

- (UIImage *)captureScreenHierarchyWithScale:(CGFloat)scale {
    // Restrict capture strictly to active foreground app
    if ([UIApplication sharedApplication].applicationState != UIApplicationStateActive) {
        return nil;
    }

    CGRect screenBounds = GetAppScreenBounds();
    CGFloat screenScale = GetAppScreenScale();
    CGFloat finalScale = screenScale * scale;
    if (finalScale <= 0.0) finalScale = screenScale;
    if (screenBounds.size.width <= 0 || screenBounds.size.height <= 0) {
        screenBounds = CGRectMake(0, 0, 393, 852);
    }

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
        if (w.hidden || w.alpha <= 0.01 || w.bounds.size.width <= 0 || IsInternalSystemWindow(w)) continue;
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
        // Invert Y axis for CGBitmapContext so row 0 aligns with the top of the video frame
        CGContextTranslateCTM(context, 0, size.height);
        CGContextScaleCTM(context, 1.0, -1.0);
        UIGraphicsPushContext(context);
        [image drawInRect:CGRectMake(0, 0, size.width, size.height)];
        UIGraphicsPopContext();
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
        CGRect bounds = GetAppScreenBounds();
        CGFloat screenScale = GetAppScreenScale();
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
        NSString *filename = [self generateCaptureFilename:@"video" ext:@"mp4"];
        NSString *filePath = [[self getCapturesDirectory] stringByAppendingPathComponent:filename];
        NSURL *outputUrl = [NSURL fileURLWithPath:filePath];

        NSError *error = nil;
        self->_softwareAssetWriter = [AVAssetWriter assetWriterWithURL:outputUrl fileType:AVFileTypeMPEG4 error:&error];
        if (error || !self->_softwareAssetWriter) {
            reject(@"RECORDER_ERROR", error.localizedDescription ?: @"Failed to initialize AVAssetWriter", error);
            return;
        }

        // Read bitrate from options (default: adaptive based on resolution)
        double bitrateParam = [options[@"bitrate"] doubleValue];
        if (bitrateParam <= 0.0) {
            // Auto-calculate: ~6 Mbps for 1080p, scales proportionally
            bitrateParam = (double)(width * height) * 4.0;
            if (bitrateParam < 1000000.0) bitrateParam = 1000000.0; // Floor: 1 Mbps
            if (bitrateParam > 20000000.0) bitrateParam = 20000000.0; // Ceiling: 20 Mbps
        }

        NSDictionary *videoSettings = @{
            AVVideoCodecKey: AVVideoCodecTypeH264,
            AVVideoWidthKey: @(videoSize.width),
            AVVideoHeightKey: @(videoSize.height),
            AVVideoCompressionPropertiesKey: @{
                AVVideoAverageBitRateKey: @((NSInteger)bitrateParam),
                AVVideoMaxKeyFrameIntervalKey: @(30),
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoExpectedSourceFrameRateKey: @([options[@"fps"] doubleValue] > 0 ? [options[@"fps"] doubleValue] : 30),
            },
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
        if (fps <= 0.0 || fps > 60.0) fps = 30.0;
        double frameInterval = 1.0 / fps;

        double maxDuration = [options[@"maxDurationSeconds"] doubleValue];
        if (maxDuration <= 0.0 || maxDuration > 300.0) maxDuration = 120.0;

        // Immediately capture frame 0 & save thumbnail
        UIImage *firstImg = [self captureScreenHierarchyWithScale:(CGFloat)scaleParam];
        if (firstImg) {
            NSData *thumbData = UIImageJPEGRepresentation(firstImg, 0.8);
            if (thumbData) {
                NSString *thumbBaseName = [[filename stringByDeletingPathExtension] stringByReplacingOccurrencesOfString:@"_video_" withString:@"_thumb_"];
                NSString *thumbFilename = [NSString stringWithFormat:@"%@.jpg", thumbBaseName];
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
        __block BOOL isFrameBusy = NO;
        NSTimeInterval recordingStartTime = self->_softwareRecordingStartTime;
        dispatch_source_set_event_handler(self->_softwareRecordingTimerSource, ^{
            NetworkInspectorModule *strongSelf = weakSelf;
            if (!strongSelf || !strongSelf->_isSoftwareRecordingActive) return;

            // Auto-stop guard: enforce max recording duration
            NSTimeInterval elapsed = [[NSDate date] timeIntervalSince1970] - recordingStartTime;
            if (elapsed >= maxDuration) {
                strongSelf->_isSoftwareRecordingActive = NO;
                return;
            }

            if (isFrameBusy) {
                // Drop frame tick if previous frame capture or encoding is still executing to prevent UI freezing
                return;
            }
            isFrameBusy = YES;

            // Fast snapshot on main queue without blocking user interactions
            dispatch_async(dispatch_get_main_queue(), ^{
                if (!strongSelf || !strongSelf->_isSoftwareRecordingActive) {
                    isFrameBusy = NO;
                    return;
                }
                if (!strongSelf->_softwareAssetWriter || strongSelf->_softwareAssetWriter.status != AVAssetWriterStatusWriting) {
                    isFrameBusy = NO;
                    return;
                }

                UIImage *frameImg = [strongSelf captureScreenHierarchyWithScale:(CGFloat)scaleParam];

                // Offload all heavy CVPixelBuffer creation, context drawing, and AVAssetWriter append to background queue
                dispatch_async(queue, ^{
                    @try {
                        if (strongSelf && strongSelf->_isSoftwareRecordingActive && frameImg && strongSelf->_softwareWriterInput.isReadyForMoreMediaData) {
                            CVPixelBufferRef buffer = [strongSelf createPixelBufferFromUIImage:frameImg size:videoSize];
                            if (buffer) {
                                CMTime presentTime = CMTimeMake((int64_t)(strongSelf->_softwareFrameIndex * 1000 / fps), 1000);
                                [strongSelf->_softwarePixelBufferAdaptor appendPixelBuffer:buffer withPresentationTime:presentTime];
                                CVPixelBufferRelease(buffer);
                                strongSelf->_softwareFrameIndex++;
                            }
                        }
                    } @finally {
                        isFrameBusy = NO;
                    }
                });
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
            NSString *filename = [self generateCaptureFilename:@"screenshot" ext:ext];
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
        } else {
            @try {
                NSURL *vidUrl = [NSURL fileURLWithPath:filePath];
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
                        NSString *generatedThumbFile = [self generateCaptureFilename:@"thumb" ext:@"jpg"];
                        NSString *generatedThumbPath = [[self getCapturesDirectory] stringByAppendingPathComponent:generatedThumbFile];
                        [tData writeToFile:generatedThumbPath atomically:YES];
                        result[@"thumbnailUri"] = [NSURL fileURLWithPath:generatedThumbPath].absoluteString;
                    }
                }
            } @catch (NSException *e) {}
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

            UIViewController *rootVC = GetTopViewController();
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
            NSString *filename = [self generateCaptureFilename:@"anim" ext:@"gif"];
            NSString *filePath = [[self getCapturesDirectory] stringByAppendingPathComponent:filename];
            NSURL *gifUrl = [NSURL fileURLWithPath:filePath];

            CGImageDestinationRef destination = CGImageDestinationCreateWithURL((__bridge CFURLRef)gifUrl, (CFStringRef)@"com.compuserve.gif", 0, NULL);
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
            if ([file hasPrefix:@"thumb_"] || [file containsString:@"_thumb_"]) continue;

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
                // Try new naming convention: replace _video_ with _thumb_ in base name
                NSString *nameWithoutExt = [file stringByDeletingPathExtension];
                NSString *thumbBaseName = [nameWithoutExt stringByReplacingOccurrencesOfString:@"_video_" withString:@"_thumb_"];
                NSString *thumbFile = [NSString stringWithFormat:@"%@.jpg", thumbBaseName];
                NSString *thumbFullPath = [dir stringByAppendingPathComponent:thumbFile];
                // Fallback: legacy naming convention (thumb_{timestamp}.jpg)
                if (![[NSFileManager defaultManager] fileExistsAtPath:thumbFullPath]) {
                    NSString *timestampSuffix = [nameWithoutExt stringByReplacingOccurrencesOfString:@"video_" withString:@""];
                    thumbFile = [NSString stringWithFormat:@"thumb_%@.jpg", timestampSuffix];
                    thumbFullPath = [dir stringByAppendingPathComponent:thumbFile];
                }
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
                if ([filename containsString:@"_video_"] || [filename hasPrefix:@"video_"]) {
                    NSString *nameWithoutExt = [filename stringByDeletingPathExtension];
                    // Try new convention: replace _video_ with _thumb_
                    NSString *thumbBaseName = [nameWithoutExt stringByReplacingOccurrencesOfString:@"_video_" withString:@"_thumb_"];
                    NSString *thumbFile = [NSString stringWithFormat:@"%@.jpg", thumbBaseName];
                    NSString *thumbPath = [[path stringByDeletingLastPathComponent] stringByAppendingPathComponent:thumbFile];
                    if ([[NSFileManager defaultManager] fileExistsAtPath:thumbPath]) {
                        [[NSFileManager defaultManager] removeItemAtPath:thumbPath error:nil];
                    }
                    // Fallback: legacy convention
                    NSString *timestampSuffix = [nameWithoutExt stringByReplacingOccurrencesOfString:@"video_" withString:@""];
                    NSString *legacyThumbFile = [NSString stringWithFormat:@"thumb_%@.jpg", timestampSuffix];
                    NSString *legacyThumbPath = [[path stringByDeletingLastPathComponent] stringByAppendingPathComponent:legacyThumbFile];
                    if ([[NSFileManager defaultManager] fileExistsAtPath:legacyThumbPath]) {
                        [[NSFileManager defaultManager] removeItemAtPath:legacyThumbPath error:nil];
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

RCT_EXPORT_METHOD(copyMediaToClipboard:(NSString *)filePath
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    if (!filePath || filePath.length == 0) {
        resolve(@{@"success": @(NO), @"error": @"File path is empty"});
        return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            NSString *cleanPath = filePath;
            if ([cleanPath hasPrefix:@"file://"]) {
                cleanPath = [cleanPath substringFromIndex:7];
            }
            cleanPath = [cleanPath stringByRemovingPercentEncoding];

            UIImage *img = [UIImage imageWithContentsOfFile:cleanPath];
            if (img) {
                [UIPasteboard generalPasteboard].image = img;
                resolve(@{@"success": @(YES), @"type": @"image"});
            } else {
                NSURL *fileURL = [NSURL fileURLWithPath:cleanPath];
                if (fileURL) {
                    [UIPasteboard generalPasteboard].URL = fileURL;
                    resolve(@{@"success": @(YES), @"type": @"url"});
                } else {
                    [UIPasteboard generalPasteboard].string = filePath;
                    resolve(@{@"success": @(YES), @"type": @"string"});
                }
            }
        } @catch (NSException *ex) {
            resolve(@{@"success": @(NO), @"error": ex.reason ?: @"Copy failed"});
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

// ─────────────────────────────────────────────────────────────────────────────
// 100% Native Media Editor: Photo Editing (CoreImage + ImageIO)
// ─────────────────────────────────────────────────────────────────────────────

static UIColor *inspectorColorFromHex(NSString *hexString, UIColor *defaultColor) {
    if (!hexString || ![hexString isKindOfClass:[NSString class]]) {
        return defaultColor ?: [UIColor redColor];
    }
    NSString *cleanHex = [hexString stringByReplacingOccurrencesOfString:@"#" withString:@""];
    cleanHex = [cleanHex stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    unsigned int rgbValue = 0;
    NSScanner *scanner = [NSScanner scannerWithString:cleanHex];
    [scanner scanHexInt:&rgbValue];
    
    if (cleanHex.length == 8) {
        CGFloat r = ((rgbValue & 0xFF000000) >> 24) / 255.0;
        CGFloat g = ((rgbValue & 0x00FF0000) >> 16) / 255.0;
        CGFloat b = ((rgbValue & 0x0000FF00) >> 8) / 255.0;
        CGFloat a = (rgbValue & 0x000000FF) / 255.0;
        return [UIColor colorWithRed:r green:g blue:b alpha:a];
    } else if (cleanHex.length == 6) {
        CGFloat r = ((rgbValue & 0xFF0000) >> 16) / 255.0;
        CGFloat g = ((rgbValue & 0x00FF00) >> 8) / 255.0;
        CGFloat b = (rgbValue & 0x0000FF) / 255.0;
        return [UIColor colorWithRed:r green:g blue:b alpha:1.0];
    } else if (cleanHex.length == 3) {
        CGFloat r = (((rgbValue & 0xF00) >> 8) * 17) / 255.0;
        CGFloat g = (((rgbValue & 0x0F0) >> 4) * 17) / 255.0;
        CGFloat b = ((rgbValue & 0x00F) * 17) / 255.0;
        return [UIColor colorWithRed:r green:g blue:b alpha:1.0];
    }
    return defaultColor ?: [UIColor redColor];
}

RCT_EXPORT_METHOD(editPhoto:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @autoreleasepool {
            @try {
                NSString *rawUri = options[@"uri"];
                if (!rawUri || rawUri.length == 0) {
                    reject(@"INVALID_URI", @"Image URI is missing or empty", nil);
                    return;
                }

                NSString *cleanPath = rawUri;
                if ([cleanPath hasPrefix:@"file://"]) {
                    cleanPath = [cleanPath substringFromIndex:7];
                }
                cleanPath = [cleanPath stringByRemovingPercentEncoding];

                UIImage *sourceImage = [UIImage imageWithContentsOfFile:cleanPath];
                if (!sourceImage) {
                    reject(@"IMAGE_LOAD_FAILED", @"Failed to load source image", nil);
                    return;
                }

                // 1. Convert to CIImage
                CIImage *ciImage = [CIImage imageWithCGImage:sourceImage.CGImage];
                if (!ciImage) {
                    ciImage = [CIImage imageWithContentsOfURL:[NSURL fileURLWithPath:cleanPath]];
                }
                if (!ciImage) {
                    reject(@"CIIMAGE_FAILED", @"Failed to initialize CoreImage pipeline", nil);
                    return;
                }

                // 2. Apply Rotation & Flip
                NSInteger rotation = [options[@"rotation"] integerValue];
                BOOL flipH = [options[@"flipHorizontal"] boolValue];
                BOOL flipV = [options[@"flipVertical"] boolValue];

                CGAffineTransform transform = CGAffineTransformIdentity;
                if (rotation == 90) {
                    transform = CGAffineTransformRotate(transform, -M_PI_2);
                } else if (rotation == 180) {
                    transform = CGAffineTransformRotate(transform, M_PI);
                } else if (rotation == 270) {
                    transform = CGAffineTransformRotate(transform, M_PI_2);
                }
                if (flipH) {
                    transform = CGAffineTransformScale(transform, -1, 1);
                }
                if (flipV) {
                    transform = CGAffineTransformScale(transform, 1, -1);
                }
                if (!CGAffineTransformIsIdentity(transform)) {
                    ciImage = [ciImage imageByApplyingTransform:transform];
                    CGRect newExtent = ciImage.extent;
                    CGAffineTransform fixOrigin = CGAffineTransformMakeTranslation(-newExtent.origin.x, -newExtent.origin.y);
                    ciImage = [ciImage imageByApplyingTransform:fixOrigin];
                }

                // 3. Apply Crop
                NSDictionary *cropDict = options[@"crop"];
                if (cropDict && [cropDict isKindOfClass:[NSDictionary class]]) {
                    CGFloat x = [cropDict[@"x"] doubleValue];
                    CGFloat y = [cropDict[@"y"] doubleValue];
                    CGFloat width = [cropDict[@"width"] doubleValue];
                    CGFloat height = [cropDict[@"height"] doubleValue];
                    BOOL isNorm = [cropDict[@"isNormalized"] boolValue];

                    CGRect extent = ciImage.extent;
                    if (isNorm) {
                        x *= extent.size.width;
                        y *= extent.size.height;
                        width *= extent.size.width;
                        height *= extent.size.height;
                    }
                    // CoreImage coordinate system (bottom-left origin)
                    CGFloat ciY = extent.size.height - (y + height);
                    CGRect cropRect = CGRectMake(x, ciY, width, height);
                    CGRect intersection = CGRectIntersection(extent, cropRect);
                    if (!CGRectIsNull(intersection) && intersection.size.width > 0 && intersection.size.height > 0) {
                        ciImage = [ciImage imageByCroppingToRect:intersection];
                    }
                }

                // 4. Color Grading Adjustments (CIColorControls, CITemperatureAndTint, CIVignette)
                NSDictionary *adjustments = options[@"adjustments"];
                if (adjustments && [adjustments isKindOfClass:[NSDictionary class]]) {
                    NSNumber *brightness = adjustments[@"brightness"];
                    NSNumber *contrast = adjustments[@"contrast"];
                    NSNumber *saturation = adjustments[@"saturation"];

                    if (brightness || contrast || saturation) {
                        CIFilter *colorControls = [CIFilter filterWithName:@"CIColorControls"];
                        [colorControls setValue:ciImage forKey:kCIInputImageKey];
                        if (brightness) [colorControls setValue:brightness forKey:kCIInputBrightnessKey];
                        if (contrast) [colorControls setValue:contrast forKey:kCIInputContrastKey];
                        if (saturation) [colorControls setValue:saturation forKey:kCIInputSaturationKey];
                        ciImage = colorControls.outputImage ?: ciImage;
                    }

                    NSNumber *temperature = adjustments[@"temperature"];
                    if (temperature && [temperature doubleValue] != 0) {
                        CIFilter *tempFilter = [CIFilter filterWithName:@"CITemperatureAndTint"];
                        [tempFilter setValue:ciImage forKey:kCIInputImageKey];
                        CIVector *neutral = [CIVector vectorWithX:6500 Y:0];
                        CGFloat shift = [temperature doubleValue] * 2000;
                        CIVector *target = [CIVector vectorWithX:6500 + shift Y:0];
                        [tempFilter setValue:neutral forKey:@"inputNeutral"];
                        [tempFilter setValue:target forKey:@"inputTargetNeutral"];
                        ciImage = tempFilter.outputImage ?: ciImage;
                    }

                    NSNumber *vignette = adjustments[@"vignette"];
                    if (vignette && [vignette doubleValue] > 0) {
                        CIFilter *vigFilter = [CIFilter filterWithName:@"CIVignette"];
                        [vigFilter setValue:ciImage forKey:kCIInputImageKey];
                        [vigFilter setValue:@([vignette doubleValue] * 2.0) forKey:kCIInputIntensityKey];
                        [vigFilter setValue:@(1.0) forKey:kCIInputRadiusKey];
                        ciImage = vigFilter.outputImage ?: ciImage;
                    }

                    NSNumber *sharpen = adjustments[@"sharpen"];
                    if (sharpen && [sharpen doubleValue] > 0) {
                        CIFilter *sharpFilter = [CIFilter filterWithName:@"CISharpenLuminance"];
                        [sharpFilter setValue:ciImage forKey:kCIInputImageKey];
                        [sharpFilter setValue:@([sharpen doubleValue] * 2.0) forKey:kCIInputSharpnessKey];
                        ciImage = sharpFilter.outputImage ?: ciImage;
                    }
                }

                // 5. Preset Filters
                NSString *preset = options[@"filterPreset"];
                if (preset && preset.length > 0 && ![preset isEqualToString:@"none"]) {
                    NSString *filterName = nil;
                    if ([preset isEqualToString:@"mono"]) filterName = @"CIPhotoEffectMono";
                    else if ([preset isEqualToString:@"noir"]) filterName = @"CIPhotoEffectNoir";
                    else if ([preset isEqualToString:@"sepia"]) filterName = @"CISepiaTone";
                    else if ([preset isEqualToString:@"vibrant"]) filterName = @"CIPhotoEffectChrome";
                    else if ([preset isEqualToString:@"fade"]) filterName = @"CIPhotoEffectFade";
                    else if ([preset isEqualToString:@"vintage"]) filterName = @"CIPhotoEffectInstant";

                    if (filterName) {
                        CIFilter *pFilter = [CIFilter filterWithName:filterName];
                        [pFilter setValue:ciImage forKey:kCIInputImageKey];
                        ciImage = pFilter.outputImage ?: ciImage;
                    }
                }

                // 6. GPU Render to File
                CIContext *context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer: @(NO)}];
                CGImageRef cgImage = [context createCGImage:ciImage fromRect:ciImage.extent];
                if (!cgImage) {
                    reject(@"RENDER_FAILED", @"Failed to render CGImage", nil);
                    return;
                }

                UIImage *resultImage = [UIImage imageWithCGImage:cgImage];
                CGImageRelease(cgImage);

                // 7. Apply Redactions, Freehand Drawings, Draggable Texts & Annotations Overlay if provided
                NSArray *redactions = options[@"redactions"];
                NSArray *annotations = options[@"annotations"];
                NSArray *drawings = options[@"drawings"];
                NSArray *texts = options[@"texts"];

                BOOL hasOverlay = (redactions && [redactions isKindOfClass:[NSArray class]] && redactions.count > 0) ||
                                  (annotations && [annotations isKindOfClass:[NSArray class]] && annotations.count > 0) ||
                                  (drawings && [drawings isKindOfClass:[NSArray class]] && drawings.count > 0) ||
                                  (texts && [texts isKindOfClass:[NSArray class]] && texts.count > 0);

                if (hasOverlay) {
                    UIGraphicsBeginImageContextWithOptions(resultImage.size, NO, 1.0);
                    [resultImage drawInRect:CGRectMake(0, 0, resultImage.size.width, resultImage.size.height)];
                    CGContextRef ctx = UIGraphicsGetCurrentContext();

                    CGFloat canvasW = resultImage.size.width;
                    CGFloat canvasH = resultImage.size.height;
                    CGFloat baseScale = MAX(1.0, canvasW / 380.0);

                    // A. Redactions (Blackout or Blur/Pixelate Box)
                    if (redactions && [redactions isKindOfClass:[NSArray class]]) {
                        for (NSDictionary *box in redactions) {
                            CGFloat x = [box[@"x"] doubleValue];
                            CGFloat y = [box[@"y"] doubleValue];
                            CGFloat w = [box[@"width"] doubleValue];
                            CGFloat h = [box[@"height"] doubleValue];
                            BOOL isNorm = box[@"isNormalized"] ? [box[@"isNormalized"] boolValue] : YES;
                            if (isNorm) {
                                x *= canvasW;
                                y *= canvasH;
                                w *= canvasW;
                                h *= canvasH;
                            }
                            NSString *style = box[@"style"] ?: @"blackout";
                            if ([style isEqualToString:@"blur"] || [style isEqualToString:@"pixelate"]) {
                                CGContextSetFillColorWithColor(ctx, [UIColor colorWithWhite:0.12 alpha:0.92].CGColor);
                            } else {
                                CGContextSetFillColorWithColor(ctx, [UIColor blackColor].CGColor);
                            }
                            CGContextFillRect(ctx, CGRectMake(x, y, w, h));
                        }
                    }

                    // B. Freehand Drawings & Vector Shapes (Brush, Highlighter, Arrow, Rect, Circle, Step)
                    if (drawings && [drawings isKindOfClass:[NSArray class]]) {
                        for (NSDictionary *stroke in drawings) {
                            NSString *type = stroke[@"type"] ?: @"brush";
                            NSString *hexColor = stroke[@"color"] ?: @"#EF4444";
                            UIColor *strokeColor = inspectorColorFromHex(hexColor, [UIColor redColor]);
                            CGFloat strokeWidth = stroke[@"strokeWidth"] ? [stroke[@"strokeWidth"] doubleValue] * baseScale : 4.0 * baseScale;
                            BOOL isNorm = stroke[@"isNormalized"] ? [stroke[@"isNormalized"] boolValue] : YES;
                            NSArray *points = stroke[@"points"];

                            if ([type isEqualToString:@"brush"]) {
                                if (points && points.count > 1) {
                                    CGContextSetStrokeColorWithColor(ctx, strokeColor.CGColor);
                                    CGContextSetLineWidth(ctx, strokeWidth);
                                    CGContextSetLineCap(ctx, kCGLineCapRound);
                                    CGContextSetLineJoin(ctx, kCGLineJoinRound);
                                    CGContextBeginPath(ctx);
                                    for (NSUInteger pIdx = 0; pIdx < points.count; pIdx++) {
                                        NSDictionary *pt = points[pIdx];
                                        CGFloat px = [pt[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                        CGFloat py = [pt[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                        if (pIdx == 0) {
                                            CGContextMoveToPoint(ctx, px, py);
                                        } else {
                                            CGContextAddLineToPoint(ctx, px, py);
                                        }
                                    }
                                    CGContextStrokePath(ctx);
                                }
                            } else if ([type isEqualToString:@"highlighter"]) {
                                if (points && points.count > 1) {
                                    UIColor *hiColor = [strokeColor colorWithAlphaComponent:0.4];
                                    CGContextSetStrokeColorWithColor(ctx, hiColor.CGColor);
                                    CGContextSetLineWidth(ctx, strokeWidth * 2.5);
                                    CGContextSetLineCap(ctx, kCGLineCapRound);
                                    CGContextSetLineJoin(ctx, kCGLineJoinRound);
                                    CGContextBeginPath(ctx);
                                    for (NSUInteger pIdx = 0; pIdx < points.count; pIdx++) {
                                        NSDictionary *pt = points[pIdx];
                                        CGFloat px = [pt[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                        CGFloat py = [pt[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                        if (pIdx == 0) {
                                            CGContextMoveToPoint(ctx, px, py);
                                        } else {
                                            CGContextAddLineToPoint(ctx, px, py);
                                        }
                                    }
                                    CGContextStrokePath(ctx);
                                }
                            } else if ([type isEqualToString:@"arrow"]) {
                                if (points && points.count >= 2) {
                                    NSDictionary *p0 = points[0];
                                    NSDictionary *p1 = points[points.count - 1];
                                    CGFloat x0 = [p0[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                    CGFloat y0 = [p0[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                    CGFloat x1 = [p1[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                    CGFloat y1 = [p1[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);

                                    CGContextSetStrokeColorWithColor(ctx, strokeColor.CGColor);
                                    CGContextSetLineWidth(ctx, strokeWidth);
                                    CGContextSetLineCap(ctx, kCGLineCapRound);
                                    CGContextBeginPath(ctx);
                                    CGContextMoveToPoint(ctx, x0, y0);
                                    CGContextAddLineToPoint(ctx, x1, y1);
                                    CGContextStrokePath(ctx);

                                    CGFloat dx = x1 - x0;
                                    CGFloat dy = y1 - y0;
                                    CGFloat angle = atan2(dy, dx);
                                    CGFloat headLen = MAX(14.0 * baseScale, MIN(32.0 * baseScale, strokeWidth * 3.5));
                                    CGFloat headAngle = M_PI / 6.0;
                                    CGFloat ax1 = x1 - headLen * cos(angle - headAngle);
                                    CGFloat ay1 = y1 - headLen * sin(angle - headAngle);
                                    CGFloat ax2 = x1 - headLen * cos(angle + headAngle);
                                    CGFloat ay2 = y1 - headLen * sin(angle + headAngle);

                                    CGContextSetFillColorWithColor(ctx, strokeColor.CGColor);
                                    CGContextBeginPath(ctx);
                                    CGContextMoveToPoint(ctx, x1, y1);
                                    CGContextAddLineToPoint(ctx, ax1, ay1);
                                    CGContextAddLineToPoint(ctx, ax2, ay2);
                                    CGContextClosePath(ctx);
                                    CGContextFillPath(ctx);
                                }
                            } else if ([type isEqualToString:@"rect"]) {
                                NSDictionary *p0 = (points && points.count > 0) ? points[0] : nil;
                                NSDictionary *p1 = (points && points.count > 1) ? points[1] : p0;
                                CGFloat x0 = [p0[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                CGFloat y0 = [p0[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                CGFloat x1 = [p1[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                CGFloat y1 = [p1[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                CGRect rect = CGRectMake(MIN(x0, x1), MIN(y0, y1), ABS(x1 - x0), ABS(y1 - y0));
                                CGContextSetStrokeColorWithColor(ctx, strokeColor.CGColor);
                                CGContextSetLineWidth(ctx, strokeWidth);
                                CGContextStrokeRect(ctx, rect);
                            } else if ([type isEqualToString:@"circle"] || [type isEqualToString:@"spotlight"]) {
                                NSDictionary *p0 = (points && points.count > 0) ? points[0] : nil;
                                NSDictionary *p1 = (points && points.count > 1) ? points[1] : p0;
                                CGFloat x0 = [p0[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                CGFloat y0 = [p0[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                CGFloat x1 = [p1[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                CGFloat y1 = [p1[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                CGRect rect = CGRectMake(MIN(x0, x1), MIN(y0, y1), ABS(x1 - x0), ABS(y1 - y0));
                                CGContextSetStrokeColorWithColor(ctx, strokeColor.CGColor);
                                CGContextSetLineWidth(ctx, strokeWidth);
                                CGContextStrokeEllipseInRect(ctx, rect);
                            } else if ([type isEqualToString:@"step"]) {
                                NSDictionary *p0 = (points && points.count > 0) ? points[0] : nil;
                                CGFloat cx = [p0[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                                CGFloat cy = [p0[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                                CGFloat radius = 16.0 * baseScale;
                                CGRect badgeRect = CGRectMake(cx - radius, cy - radius, radius * 2, radius * 2);

                                CGContextSetFillColorWithColor(ctx, strokeColor.CGColor);
                                CGContextFillEllipseInRect(ctx, badgeRect);

                                CGContextSetStrokeColorWithColor(ctx, [UIColor whiteColor].CGColor);
                                CGContextSetLineWidth(ctx, 2.0 * baseScale);
                                CGContextStrokeEllipseInRect(ctx, badgeRect);

                                NSInteger stepNum = stroke[@"stepNumber"] ? [stroke[@"stepNumber"] integerValue] : 1;
                                NSString *stepStr = [NSString stringWithFormat:@"%ld", (long)stepNum];
                                UIFont *font = [UIFont boldSystemFontOfSize:14.0 * baseScale];
                                NSDictionary *attrs = @{
                                    NSFontAttributeName: font,
                                    NSForegroundColorAttributeName: [UIColor whiteColor]
                                };
                                CGSize strSize = [stepStr sizeWithAttributes:attrs];
                                CGPoint strOrigin = CGPointMake(cx - strSize.width / 2.0, cy - strSize.height / 2.0);
                                [stepStr drawAtPoint:strOrigin withAttributes:attrs];
                            }
                        }
                    }

                    // C. Draggable Text Badges / Notes
                    if (texts && [texts isKindOfClass:[NSArray class]]) {
                        for (NSDictionary *tItem in texts) {
                            NSString *textStr = tItem[@"text"] ?: @"";
                            if (textStr.length == 0) continue;
                            BOOL isNorm = tItem[@"isNormalized"] ? [tItem[@"isNormalized"] boolValue] : YES;
                            CGFloat tx = [tItem[@"x"] doubleValue] * (isNorm ? canvasW : 1.0);
                            CGFloat ty = [tItem[@"y"] doubleValue] * (isNorm ? canvasH : 1.0);
                            NSString *textColorHex = tItem[@"color"] ?: @"#FFFFFF";
                            NSString *bgColorHex = tItem[@"bgColor"] ?: @"#EF4444";
                            UIColor *textColor = inspectorColorFromHex(textColorHex, [UIColor whiteColor]);
                            UIColor *bgColor = inspectorColorFromHex(bgColorHex, [UIColor redColor]);

                            UIFont *font = [UIFont boldSystemFontOfSize:15.0 * baseScale];
                            NSDictionary *attrs = @{
                                NSFontAttributeName: font,
                                NSForegroundColorAttributeName: textColor
                            };
                            CGSize strSize = [textStr sizeWithAttributes:attrs];
                            CGFloat padH = 12.0 * baseScale;
                            CGFloat padV = 6.0 * baseScale;
                            CGRect pillRect = CGRectMake(tx, ty, strSize.width + padH * 2.0, strSize.height + padV * 2.0);
                            UIBezierPath *roundedPill = [UIBezierPath bezierPathWithRoundedRect:pillRect cornerRadius:pillRect.size.height / 2.0];

                            CGContextSetFillColorWithColor(ctx, bgColor.CGColor);
                            CGContextAddPath(ctx, roundedPill.CGPath);
                            CGContextFillPath(ctx);

                            CGContextSetStrokeColorWithColor(ctx, [[UIColor whiteColor] colorWithAlphaComponent:0.4].CGColor);
                            CGContextSetLineWidth(ctx, 1.5 * baseScale);
                            CGContextAddPath(ctx, roundedPill.CGPath);
                            CGContextStrokePath(ctx);

                            [textStr drawAtPoint:CGPointMake(tx + padH, ty + padV) withAttributes:attrs];
                        }
                    }

                    // D. Legacy / Standalone Annotations
                    if (annotations && [annotations isKindOfClass:[NSArray class]] && (!drawings || drawings.count == 0)) {
                        for (NSDictionary *ann in annotations) {
                            CGFloat x = [ann[@"x"] doubleValue];
                            CGFloat y = [ann[@"y"] doubleValue];
                            CGFloat w = [ann[@"width"] doubleValue];
                            CGFloat h = [ann[@"height"] doubleValue];
                            BOOL isNorm = [ann[@"isNormalized"] boolValue];
                            if (isNorm) {
                                x *= canvasW;
                                y *= canvasH;
                                w *= canvasW;
                                h *= canvasH;
                            }
                            NSString *annColorHex = ann[@"color"] ?: @"#EF4444";
                            UIColor *annColor = inspectorColorFromHex(annColorHex, [UIColor redColor]);
                            CGContextSetStrokeColorWithColor(ctx, annColor.CGColor);
                            CGContextSetLineWidth(ctx, 4.0 * baseScale);
                            CGContextStrokeRect(ctx, CGRectMake(x, y, w, h));

                            NSString *label = ann[@"label"];
                            if (label && [label isKindOfClass:[NSString class]] && label.length > 0) {
                                UIFont *font = [UIFont boldSystemFontOfSize:13.0 * baseScale];
                                NSDictionary *attrs = @{
                                    NSFontAttributeName: font,
                                    NSForegroundColorAttributeName: [UIColor whiteColor]
                                };
                                CGSize strSize = [label sizeWithAttributes:attrs];
                                CGFloat padH = 6.0 * baseScale;
                                CGFloat padV = 3.0 * baseScale;
                                CGRect tagRect = CGRectMake(x, MAX(0, y - strSize.height - padV * 2.0), strSize.width + padH * 2.0, strSize.height + padV * 2.0);
                                CGContextSetFillColorWithColor(ctx, annColor.CGColor);
                                CGContextFillRect(ctx, tagRect);
                                [label drawAtPoint:CGPointMake(tagRect.origin.x + padH, tagRect.origin.y + padV) withAttributes:attrs];
                            }
                        }
                    }

                    resultImage = UIGraphicsGetImageFromCurrentImageContext();
                    UIGraphicsEndImageContext();
                }

                NSString *format = [options[@"format"] lowercaseString] ?: @"jpeg";
                CGFloat quality = options[@"quality"] ? [options[@"quality"] doubleValue] : 0.9;
                NSData *imageData = nil;
                NSString *ext = @"jpg";
                NSString *mime = @"image/jpeg";

                if ([format isEqualToString:@"png"]) {
                    imageData = UIImagePNGRepresentation(resultImage);
                    ext = @"png";
                    mime = @"image/png";
                } else {
                    imageData = UIImageJPEGRepresentation(resultImage, quality);
                }

                NSString *fileName = [self generateCaptureFilename:@"edit" ext:ext];
                NSString *outPath = [[self getCapturesDirectory] stringByAppendingPathComponent:fileName];
                [imageData writeToFile:outPath atomically:YES];

                resolve(@{
                    @"uri": [NSURL fileURLWithPath:outPath].absoluteString,
                    @"width": @(resultImage.size.width),
                    @"height": @(resultImage.size.height),
                    @"size": @(imageData.length),
                    @"mimeType": mime,
                    @"format": format,
                });
            } @catch (NSException *ex) {
                reject(@"EDIT_FAILED", ex.reason ?: @"Photo edit failed", nil);
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 100% Native Media Editor: Video Trimming (AVFoundation)
// ─────────────────────────────────────────────────────────────────────────────

RCT_EXPORT_METHOD(trimVideo:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSString *rawUri = options[@"uri"];
            if (!rawUri || rawUri.length == 0) {
                reject(@"INVALID_URI", @"Video URI is missing", nil);
                return;
            }

            NSURL *sourceUrl = [NSURL URLWithString:rawUri];
            if (!sourceUrl.scheme) {
                sourceUrl = [NSURL fileURLWithPath:rawUri];
            }

            AVURLAsset *asset = [AVURLAsset URLAssetWithURL:sourceUrl options:nil];
            double startMs = [options[@"startTimeMs"] doubleValue];
            double endMs = [options[@"endTimeMs"] doubleValue];
            BOOL mute = [options[@"mute"] boolValue] || [options[@"muteAudio"] boolValue];

            AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
            if (!videoTrack) {
                reject(@"NO_VIDEO_TRACK", @"Source video has no valid video track", nil);
                return;
            }

            double trackDurationSec = CMTimeGetSeconds(videoTrack.timeRange.duration);
            if (isnan(trackDurationSec) || trackDurationSec <= 0) {
                trackDurationSec = CMTimeGetSeconds(asset.duration);
            }
            double trackDurationMs = trackDurationSec * 1000.0;
            if (endMs > trackDurationMs || endMs <= 0) {
                endMs = trackDurationMs;
            }
            if (startMs >= endMs) {
                startMs = 0;
            }

            AVMutableComposition *composition = [AVMutableComposition composition];
            AVMutableCompositionTrack *compVideoTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];

            CMTime startTime = CMTimeMakeWithSeconds(startMs / 1000.0, 600);
            CMTime durationTime = CMTimeMakeWithSeconds((endMs - startMs) / 1000.0, 600);
            CMTimeRange timeRange = CMTimeRangeMake(startTime, durationTime);

            NSError *error = nil;
            [compVideoTrack insertTimeRange:timeRange ofTrack:videoTrack atTime:kCMTimeZero error:&error];
            compVideoTrack.preferredTransform = videoTrack.preferredTransform;

            if (!mute) {
                AVAssetTrack *audioTrack = [[asset tracksWithMediaType:AVMediaTypeAudio] firstObject];
                if (audioTrack) {
                    AVMutableCompositionTrack *compAudioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
                    CMTimeRange audioTimeRange = timeRange;
                    double audioDurationSec = CMTimeGetSeconds(audioTrack.timeRange.duration);
                    if (!isnan(audioDurationSec) && audioDurationSec > 0) {
                        double audioDurationMs = audioDurationSec * 1000.0;
                        if (endMs > audioDurationMs) {
                            audioTimeRange = CMTimeRangeMake(startTime, CMTimeMakeWithSeconds((audioDurationMs - startMs) / 1000.0, 600));
                        }
                    }
                    [compAudioTrack insertTimeRange:audioTimeRange ofTrack:audioTrack atTime:kCMTimeZero error:nil];
                }
            }

            NSString *preset = AVAssetExportPresetHighestQuality;
            NSString *quality = options[@"quality"];
            if ([quality isEqualToString:@"medium"]) preset = AVAssetExportPreset1280x720;
            else if ([quality isEqualToString:@"low"]) preset = AVAssetExportPreset640x480;

            AVAssetExportSession *exportSession = [AVAssetExportSession exportSessionWithAsset:composition presetName:preset];
            NSString *fileName = [self generateCaptureFilename:@"trim" ext:@"mp4"];
            NSString *outPath = [[self getCapturesDirectory] stringByAppendingPathComponent:fileName];
            NSURL *outUrl = [NSURL fileURLWithPath:outPath];

            exportSession.outputURL = outUrl;
            exportSession.outputFileType = AVFileTypeMPEG4;
            exportSession.shouldOptimizeForNetworkUse = YES;

            [exportSession exportAsynchronouslyWithCompletionHandler:^{
                if (exportSession.status == AVAssetExportSessionStatusCompleted) {
                    NSDictionary *attrs = [[NSFileManager defaultManager] attributesOfItemAtPath:outPath error:nil];
                    CGSize natSize = CGSizeApplyAffineTransform(videoTrack.naturalSize, videoTrack.preferredTransform);
                    resolve(@{
                        @"uri": outUrl.absoluteString,
                        @"durationMs": @(endMs - startMs),
                        @"size": @([attrs fileSize]),
                        @"width": @(fabs(natSize.width)),
                        @"height": @(fabs(natSize.height)),
                        @"format": @"mp4",
                    });
                } else {
                    reject(@"EXPORT_FAILED", exportSession.error.localizedDescription ?: @"Video export failed", exportSession.error);
                }
            }];
        } @catch (NSException *ex) {
            reject(@"TRIM_FAILED", ex.reason ?: @"Video trim failed", nil);
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 100% Native Media Editor: Filmstrip Thumbnail Generator (AVAssetImageGenerator)
// ─────────────────────────────────────────────────────────────────────────────

RCT_EXPORT_METHOD(generateFilmstrip:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            NSString *rawUri = options[@"uri"];
            if (!rawUri || rawUri.length == 0) {
                reject(@"INVALID_URI", @"Video URI is missing", nil);
                return;
            }

            NSURL *sourceUrl = [NSURL URLWithString:rawUri];
            if (!sourceUrl.scheme) {
                sourceUrl = [NSURL fileURLWithPath:rawUri];
            }

            AVURLAsset *asset = [AVURLAsset URLAssetWithURL:sourceUrl options:nil];
            NSInteger count = options[@"count"] ? [options[@"count"] integerValue] : 10;
            if (count <= 0) count = 10;
            if (count > 50) count = 50;

            CGFloat targetWidth = options[@"maxWidth"] ? [options[@"maxWidth"] doubleValue] : (options[@"targetWidth"] ? [options[@"targetWidth"] doubleValue] : 120);
            CGFloat targetHeight = options[@"maxHeight"] ? [options[@"maxHeight"] doubleValue] : (options[@"targetHeight"] ? [options[@"targetHeight"] doubleValue] : 120);
            CGFloat quality = options[@"quality"] ? [options[@"quality"] doubleValue] : 0.7;

            double durationSeconds = CMTimeGetSeconds(asset.duration);
            if (durationSeconds <= 0) {
                reject(@"INVALID_DURATION", @"Unable to determine video duration", nil);
                return;
            }

            AVAssetImageGenerator *generator = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
            generator.appliesPreferredTrackTransform = YES;
            generator.maximumSize = CGSizeMake(targetWidth, targetHeight);
            generator.requestedTimeToleranceBefore = kCMTimeZero;
            generator.requestedTimeToleranceAfter = kCMTimeZero;

            NSMutableArray *thumbnails = [NSMutableArray arrayWithCapacity:count];
            double step = durationSeconds / (double)count;

            for (NSInteger i = 0; i < count; i++) {
                double targetSec = i * step;
                CMTime time = CMTimeMakeWithSeconds(targetSec, 600);
                NSError *genErr = nil;
                CGImageRef cgImage = [generator copyCGImageAtTime:time actualTime:NULL error:&genErr];
                if (cgImage) {
                    UIImage *img = [UIImage imageWithCGImage:cgImage];
                    CGImageRelease(cgImage);
                    NSData *data = UIImageJPEGRepresentation(img, quality);
                    NSString *b64 = [data base64EncodedStringWithOptions:0];
                    NSString *dataUrl = [NSString stringWithFormat:@"data:image/jpeg;base64,%@", b64];
                    [thumbnails addObject:@{
                        @"timeMs": @(targetSec * 1000.0),
                        @"uri": dataUrl,
                        @"index": @(i),
                    }];
                }
            }

            resolve(@{
                @"thumbnails": thumbnails,
                @"durationMs": @(durationSeconds * 1000.0),
            });
        } @catch (NSException *ex) {
            reject(@"FILMSTRIP_FAILED", ex.reason ?: @"Filmstrip generation failed", nil);
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIVE CAMERA ROLL / PHOTO & VIDEO PICKER
// ─────────────────────────────────────────────────────────────────────────────

RCT_EXPORT_METHOD(pickMedia:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *mediaType = options[@"mediaType"] ?: @"any";
        UIViewController *rootVC = GetTopViewController();
        if (!rootVC) {
            reject(@"PICK_ERROR", @"Unable to find active view controller for media picker", nil);
            return;
        }

        g_pickerDelegate = [[InAppInspectorPickerDelegate alloc] init];
        g_pickerDelegate.resolve = resolve;
        g_pickerDelegate.reject = reject;
        g_pickerDelegate.capturesDirectory = [self getCapturesDirectory];

        if (@available(iOS 14.0, *)) {
            PHPickerConfiguration *config = [[PHPickerConfiguration alloc] init];
            config.selectionLimit = 1;

            if ([mediaType isEqualToString:@"image"]) {
                config.filter = [PHPickerFilter imagesFilter];
            } else if ([mediaType isEqualToString:@"video"]) {
                config.filter = [PHPickerFilter videosFilter];
            } else {
                config.filter = [PHPickerFilter anyFilterMatchingSubfilters:@[[PHPickerFilter imagesFilter], [PHPickerFilter videosFilter]]];
            }

            PHPickerViewController *picker = [[PHPickerViewController alloc] initWithConfiguration:config];
            picker.delegate = g_pickerDelegate;
            [rootVC presentViewController:picker animated:YES completion:nil];
        } else {
            UIImagePickerController *picker = [[UIImagePickerController alloc] init];
            picker.delegate = g_pickerDelegate;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
            if ([mediaType isEqualToString:@"image"]) {
                picker.mediaTypes = @[(NSString *)kUTTypeImage];
            } else if ([mediaType isEqualToString:@"video"]) {
                picker.mediaTypes = @[(NSString *)kUTTypeMovie];
            } else {
                picker.mediaTypes = @[(NSString *)kUTTypeImage, (NSString *)kUTTypeMovie];
            }
#pragma clang diagnostic pop
            [rootVC presentViewController:picker animated:YES completion:nil];
        }
    });
}

RCT_EXPORT_METHOD(writeExportFile:(NSString *)filename
                  content:(NSString *)content
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            if (!filename || filename.length == 0) {
                reject(@"INVALID_FILENAME", @"Filename is missing", nil);
                return;
            }
            NSString *dir = [self getCapturesDirectory];
            NSString *cleanFilename = [filename lastPathComponent];
            NSString *outPath = [dir stringByAppendingPathComponent:cleanFilename];
            NSData *data = [(content ?: @"") dataUsingEncoding:NSUTF8StringEncoding];
            BOOL success = [data writeToFile:outPath atomically:YES];
            if (success) {
                resolve([NSURL fileURLWithPath:outPath].absoluteString);
            } else {
                reject(@"WRITE_FAILED", @"Failed to write export file", nil);
            }
        } @catch (NSException *e) {
            reject(@"WRITE_ERROR", e.reason, nil);
        }
    });
}

RCT_EXPORT_METHOD(shareFile:(NSString *)filePath
                  mimeType:(NSString *)mimeType
                  title:(NSString *)title
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        @try {
            NSString *cleanPath = filePath;
            if ([cleanPath hasPrefix:@"file://"]) {
                cleanPath = [cleanPath substringFromIndex:7];
            }
            cleanPath = [cleanPath stringByRemovingPercentEncoding];
            if (![[NSFileManager defaultManager] fileExistsAtPath:cleanPath]) {
                reject(@"FILE_NOT_FOUND", @"File not found", nil);
                return;
            }
            NSURL *fileUrl = [NSURL fileURLWithPath:cleanPath];
            UIActivityViewController *activityVC = [[UIActivityViewController alloc] initWithActivityItems:@[fileUrl] applicationActivities:nil];
            if (title && title.length > 0) {
                [activityVC setValue:title forKey:@"subject"];
            }
            UIViewController *rootVC = GetTopViewController();
            if (!rootVC) {
                reject(@"SHARE_ERROR", @"Unable to find active view controller to share file", nil);
                return;
            }
            if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad && rootVC.view) {
                activityVC.popoverPresentationController.sourceView = rootVC.view;
                activityVC.popoverPresentationController.sourceRect = CGRectMake(CGRectGetMidX(rootVC.view.bounds), CGRectGetMidY(rootVC.view.bounds), 1, 1);
                activityVC.popoverPresentationController.permittedArrowDirections = 0;
            }
            activityVC.completionWithItemsHandler = ^(UIActivityType activityType, BOOL completed, NSArray *returnedItems, NSError *activityError) {
                resolve(@(completed));
            };
            [rootVC presentViewController:activityVC animated:YES completion:nil];
        } @catch (NSException *e) {
            reject(@"SHARE_ERROR", e.reason, nil);
        }
    });
}

- (void)invalidate {
    [super invalidate];
    hasListeners = NO;
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    dispatch_async(dispatch_get_main_queue(), ^{
        if (self->displayLink != nil) {
            [self->displayLink invalidate];
            self->displayLink = nil;
        }
        if (self->_softwareRecordingTimerSource) {
            dispatch_source_cancel(self->_softwareRecordingTimerSource);
            self->_softwareRecordingTimerSource = nil;
        }
        if (floatingButtonView != nil) {
            [floatingButtonView removeFromSuperview];
            floatingButtonView = nil;
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

