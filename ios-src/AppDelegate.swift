import UIKit
import WebKit

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
        window?.makeKeyAndVisible()
        return true
    }
}

class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private var statusView: UIView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 251/255, alpha: 1.0)
        setupWebView()
        loadContent()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
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
        // 优先加载本地打包的 HTML 资源
        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "www") {
            let fileURL = URL(fileURLWithPath: htmlPath)
            let readAccessURL = fileURL.deletingLastPathComponent()
            webView.loadFileURL(fileURL, allowingReadAccessTo: readAccessURL)
            return
        }

        // 备用：尝试连接本地启动的 iSH Node 服务端口
        if let localServerURL = URL(string: "http://127.0.0.1:8765/?v=ipa") {
            webView.load(URLRequest(url: localServerURL))
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showRetryOverlay(error: error.localizedDescription)
    }

    private func showRetryOverlay(error: String) {
        statusView?.removeFromSuperview()

        let sv = UIView(frame: view.bounds)
        sv.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 251/255, alpha: 1.0)

        let label = UILabel()
        label.text = "星谕排盘\n\n离线资源未就绪或本地端口未连接\n(\(error))\n\n请确认本地 server 已启动，或将 www 静态资源放入 Bundle"
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

    @objc private func retryTapped() {
        statusView?.removeFromSuperview()
        loadContent()
    }
}
