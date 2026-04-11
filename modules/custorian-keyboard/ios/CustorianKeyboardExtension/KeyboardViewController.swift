import UIKit

/// Custom keyboard that looks normal but analyzes text for safety risks.
/// Runs as a separate iOS process — communicates with main app via App Groups.
class KeyboardViewController: UIInputViewController {

    private var textBuffer: String = ""
    private let analyzer = RiskAnalyzer.shared
    private let analyzeThreshold = 40
    private var shiftActive = false
    private var keyboardView: UIStackView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupKeyboard()
    }

    override func textDidChange(_ textInput: UITextInput?) {
        guard let context = textDocumentProxy.documentContextBeforeInput else { return }
        let recent = String(context.suffix(200))
        if recent.count >= analyzeThreshold && recent != textBuffer {
            analyzeText(recent)
            textBuffer = recent
        }
    }

    private func analyzeText(_ text: String) {
        if let alert = analyzer.analyze(text) {
            analyzer.saveAlert(alert)
        }
    }

    // MARK: - Keyboard Layout

    private func setupKeyboard() {
        let rows: [[String]] = [
            ["q","w","e","r","t","y","u","i","o","p"],
            ["a","s","d","f","g","h","j","k","l"],
            ["⇧","z","x","c","v","b","n","m","⌫"],
            ["123","🌐"," ","return"],
        ]

        keyboardView = UIStackView()
        keyboardView.axis = .vertical
        keyboardView.spacing = 6
        keyboardView.translatesAutoresizingMaskIntoConstraints = false

        for row in rows {
            let rowStack = UIStackView()
            rowStack.axis = .horizontal
            rowStack.spacing = 4
            rowStack.distribution = row.count <= 4 ? .fill : .fillEqually

            for key in row {
                let button = makeKey(key)
                if key == " " {
                    button.widthAnchor.constraint(greaterThanOrEqualToConstant: 120).isActive = true
                }
                rowStack.addArrangedSubview(button)
            }
            keyboardView.addArrangedSubview(rowStack)
        }

        view.addSubview(keyboardView)
        NSLayoutConstraint.activate([
            keyboardView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 3),
            keyboardView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -3),
            keyboardView.topAnchor.constraint(equalTo: view.topAnchor, constant: 8),
            keyboardView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -4),
        ])
    }

    private let specialKeys: Set<String> = ["⇧", "⌫", "123", "🌐", "return"]

    private func makeKey(_ key: String) -> UIButton {
        let btn = UIButton(type: .system)
        btn.setTitle(key == " " ? "space" : key, for: .normal)
        btn.titleLabel?.font = .systemFont(ofSize: key == " " ? 14 : 20)
        btn.backgroundColor = specialKeys.contains(key) ? .systemGray4 : .white
        btn.setTitleColor(.black, for: .normal)
        btn.layer.cornerRadius = 5
        btn.layer.shadowColor = UIColor.black.cgColor
        btn.layer.shadowOffset = CGSize(width: 0, height: 1)
        btn.layer.shadowOpacity = 0.12
        btn.layer.shadowRadius = 0.5
        btn.heightAnchor.constraint(greaterThanOrEqualToConstant: 42).isActive = true
        btn.accessibilityLabel = key
        btn.addTarget(self, action: #selector(keyTapped(_:)), for: .touchUpInside)
        return btn
    }

    @objc private func keyTapped(_ sender: UIButton) {
        guard let key = sender.accessibilityLabel else { return }
        switch key {
        case "⌫": textDocumentProxy.deleteBackward()
        case " ": textDocumentProxy.insertText(" ")
        case "return": textDocumentProxy.insertText("\n")
        case "⇧":
            shiftActive.toggle()
            updateShift()
        case "123": break
        case "🌐": advanceToNextInputMode()
        default:
            textDocumentProxy.insertText(shiftActive ? key.uppercased() : key)
            if shiftActive { shiftActive = false; updateShift() }
        }
    }

    private func updateShift() {
        guard let stack = keyboardView else { return }
        for case let row as UIStackView in stack.arrangedSubviews {
            for case let btn as UIButton in row.arrangedSubviews {
                guard let label = btn.accessibilityLabel, !specialKeys.contains(label) else { continue }
                btn.setTitle(shiftActive ? label.uppercased() : label, for: .normal)
            }
        }
    }
}
