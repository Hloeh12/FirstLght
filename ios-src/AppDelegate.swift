import UIKit
import WebKit
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let vc = WebViewController()
        window?.rootViewController = vc
        UNUserNotificationCenter.current().delegate = vc
        window?.makeKeyAndVisible()
        return true
    }
}

class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    private var exportedFile: URL?
    private var webView: WKWebView!
    private var statusView: UIView?
    private var serverURL: URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "FirstLightServerURL") as? String,
              let url = URL(string: value), url.scheme == "https", url.host != nil else { return nil }
        return url
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 251/255, alpha: 1.0)
        overrideUserInterfaceStyle = .light
        setupWebView()
        loadContent()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.limitsNavigationsToAppBoundDomains = true
        config.userContentController.add(self, name: "shareChart")
        config.userContentController.add(self, name: "caseReminder")
        config.preferences.javaScriptEnabled = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.bounces = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        view.addSubview(webView)
    }

    private func loadContent() {
        guard let url = serverURL else {
            showRetryOverlay(error: "服务地址尚未配置")
            return
        }
        var request = URLRequest(url: url)
        request.timeoutInterval = 180
        webView.load(request)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showRetryOverlay(error: error.localizedDescription)
    }

    private func showRetryOverlay(error: String) {
        statusView?.removeFromSuperview()

        let sv = UIView(frame: view.bounds)
        sv.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 251/255, alpha: 1.0)

        let label = UILabel()
        label.text = "星谕排盘\n\n暂时无法连接服务\n(\(error))\n\n请检查网络后重试，首次唤醒服务可能需要等待。"
        label.numberOfLines = 0
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        label.textColor = UIColor(red: 140/255, green: 140/255, blue: 154/255, alpha: 1.0)
        label.frame = CGRect(x: 24, y: sv.bounds.height / 2 - 100, width: sv.bounds.width - 48, height: 160)
        sv.addSubview(label)

        let retryBtn = UIButton(type: .system)
        retryBtn.setTitle("重试连接", for: .normal)
        retryBtn.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        retryBtn.setTitleColor(.white, for: .normal)
        retryBtn.backgroundColor = UIColor(red: 255/255, green: 79/255, blue: 139/255, alpha: 1.0)
        retryBtn.layer.cornerRadius = 22
        retryBtn.frame = CGRect(x: sv.bounds.width / 2 - 70, y: sv.bounds.height / 2 + 70, width: 140, height: 44)
        retryBtn.addTarget(self, action: #selector(retryTapped), for: .touchUpInside)
        sv.addSubview(retryBtn)

        view.addSubview(sv)
        statusView = sv
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated,
           let url = navigationAction.request.url, url.scheme == "https", url.host != serverURL?.host {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(navigationAction.shouldPerformDownload ? .download : .allow)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let file = directory.appendingPathComponent(URL(fileURLWithPath: suggestedFilename).lastPathComponent)
            exportedFile = file
            completionHandler(file)
        } catch { completionHandler(nil) }
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let file = exportedFile else { return }
        exportedFile = nil
        presentShare(file)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, let url = serverURL,
              origin.protocol == "https", origin.host == url.host,
              (origin.port == 0 ? 443 : origin.port) == (url.port ?? 443) else { return }
        if message.name == "caseReminder" {
            scheduleReminder(message.body)
            return
        }
        guard message.name == "shareChart", presentedViewController == nil,
              let payload = message.body as? String, payload.count <= 12_000_000,
              payload.hasPrefix("data:image/png;base64,"),
              let bytes = Data(base64Encoded: String(payload.dropFirst("data:image/png;base64,".count))),
              bytes.starts(with: [137, 80, 78, 71, 13, 10, 26, 10]) else { return }
        do {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let file = folder.appendingPathComponent("FirstLight-chart.png")
            try bytes.write(to: file, options: .atomic)
            presentShare(file)
        } catch {
            let alert = UIAlertController(title: "分享失败", message: "暂时无法写入长图。", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "好", style: .default))
            present(alert, animated: true)
        }
    }

    private func scheduleReminder(_ body: Any) {
        guard let request = body as? [String: Any], let id = request["id"] as? String,
              !id.isEmpty, id.count <= 64,
              id.range(of: #"^[A-Za-z0-9-]+$"#, options: .regularExpression) != nil else { return }
        let center = UNUserNotificationCenter.current()
        if request["cancel"] as? Bool == true {
            center.removePendingNotificationRequests(withIdentifiers: [id])
            return
        }
        guard let seconds = request["seconds"] as? Double, seconds.isFinite, seconds > 0,
              let text = request["message"] as? String, !text.isEmpty, text.count <= 80 else { return }
        center.requestAuthorization(options: [.alert, .sound]) { [weak self] allowed, _ in
            guard allowed else {
                self?.reportReminder("未获得通知权限，提醒仅保存在案例里。")
                return
            }
            let content = UNMutableNotificationContent()
            content.title = "星谕 · 案例提醒"
            content.body = text
            content.sound = .default
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, seconds), repeats: false)
            center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger)) { error in
                self?.reportReminder(error == nil ? "系统提醒已安排。" : "系统提醒未能安排。")
            }
        }
    }

    private func reportReminder(_ text: String) {
        guard let data = try? JSONEncoder().encode(text),
              let encoded = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript("window.firstlightReminderStatus?.(" + encoded + ")")
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }

    private func presentShare(_ file: URL) {
        let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        share.popoverPresentationController?.sourceView = view
        share.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
        share.completionWithItemsHandler = { _, _, _, _ in
            try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
        }
        present(share, animated: true)
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        let alert = UIAlertController(title: "导出失败", message: error.localizedDescription, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "好", style: .default))
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "星谕", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "好", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "星谕", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: "星谕", message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "保存", style: .default) { _ in completionHandler(alert.textFields?.first?.text) })
        present(alert, animated: true)
    }

    @objc private func retryTapped() {
        statusView?.removeFromSuperview()
        loadContent()
    }
}

