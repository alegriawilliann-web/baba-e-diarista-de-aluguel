import UIKit
import Capacitor

/// O layout do app (feito para Android) não reserva espaço para a barra de
/// status nem para o indicador de início do iPhone. O Capacitor não deixa
/// redimensionar a própria WebView (ela é a `view` do CAPBridgeViewController),
/// então ele roda como filho desta moldura, presa à área segura: o app começa
/// abaixo do relógio e termina acima da barrinha de baixo, e as faixas de
/// fora ficam na cor de fundo do app.
class MainViewController: UIViewController {
    private let corFundo = UIColor(red: 251 / 255, green: 243 / 255, blue: 231 / 255, alpha: 1) // #FBF3E7
    private let bridgeViewController = CAPBridgeViewController()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = corFundo

        addChild(bridgeViewController)
        let conteudo = bridgeViewController.view!
        conteudo.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(conteudo)
        NSLayoutConstraint.activate([
            conteudo.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            conteudo.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            conteudo.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            conteudo.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        bridgeViewController.didMove(toParent: self)

        bridgeViewController.webView?.isOpaque = false
        bridgeViewController.webView?.backgroundColor = corFundo
        bridgeViewController.webView?.scrollView.contentInsetAdjustmentBehavior = .never
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
}
