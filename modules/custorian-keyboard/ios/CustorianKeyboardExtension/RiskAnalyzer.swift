import Foundation

enum ThreatCategory: Int, Codable {
    case grooming = 0, bullying, selfHarm, violence, contentWellness
}

struct RiskAlert: Codable {
    let id: String
    let category: ThreatCategory
    let score: Double
    let snippet: String
    let sourceApp: String
    let timestamp: Date
    let reviewed: Bool
}

class RiskAnalyzer {
    static let shared = RiskAnalyzer()
    static let appGroupID = "group.com.custorian.shared"
    private let threshold: Double = 50

    func analyze(_ text: String) -> RiskAlert? {
        let t = text.lowercased()
        let scores: [(ThreatCategory, Double)] = [
            (.grooming, scoreGrooming(t)),
            (.bullying, scoreBullying(t)),
            (.selfHarm, scoreSelfHarm(t)),
            (.violence, scoreViolence(t)),
            (.contentWellness, scoreContentWellness(t)),
        ]
        guard let top = scores.max(by: { $0.1 < $1.1 }), top.1 >= threshold else { return nil }
        return RiskAlert(
            id: "\(Int(Date().timeIntervalSince1970 * 1000))",
            category: top.0, score: top.1,
            snippet: String(text.prefix(120)),
            sourceApp: "Keyboard",
            timestamp: Date(), reviewed: false
        )
    }

    func saveAlert(_ alert: RiskAlert) {
        guard let defaults = UserDefaults(suiteName: RiskAnalyzer.appGroupID) else { return }
        var alerts = loadAlerts()
        alerts.insert(alert, at: 0)
        if alerts.count > 100 { alerts = Array(alerts.prefix(100)) }
        if let data = try? JSONEncoder().encode(alerts) { defaults.set(data, forKey: "risk_alerts") }
    }

    func loadAlerts() -> [RiskAlert] {
        guard let defaults = UserDefaults(suiteName: RiskAnalyzer.appGroupID),
              let data = defaults.data(forKey: "risk_alerts"),
              let alerts = try? JSONDecoder().decode([RiskAlert].self, from: data) else { return [] }
        return alerts
    }

    // MARK: - Scoring (mirrors JS risk engine)

    private func scoreGrooming(_ t: String) -> Double {
        var s: Double = 0
        if matches(t, [#"how old are you"#, #"mature for your age"#, #"you.re (so )?(pretty|cute|hot)"#,
                        #"hvor gammel er du"#, #"du er (så )?(smuk|pæn|sød)"#]) { s += 20 }
        if matches(t, [#"don.t tell"#, #"keep.*(secret|between us)"#, #"our secret"#,
                        #"sig det ikke til"#, #"vores hemmelighed"#, #"bare mellem os"#]) { s += 30 }
        if matches(t, [#"send.*(pic|photo|selfie)"#, #"what are you wearing"#,
                        #"send.*(billede|foto|selfie)"#, #"hvad har du på"#]) { s += 25 }
        if matches(t, [#"(meet|hang out|come over)"#, #"where do you live"#, #"pick you up"#,
                        #"skal vi mødes"#, #"hvor bor du"#, #"jeg kan hente dig"#]) { s += 25 }
        return min(s, 100)
    }

    private func scoreBullying(_ t: String) -> Double {
        var s: Double = 0
        if matches(t, [#"(you.re|ur) (ugly|fat|stupid|worthless)"#, #"kill yourself"#, #"kys"#, #"go die"#,
                        #"du er (grim|dum|fed|klam)"#, #"hold kæft"#, #"slå dig selv ihjel"#]) { s += 35 }
        if matches(t, [#"nobody likes you"#, #"everyone hates you"#,
                        #"ingen kan lide dig"#, #"alle hader dig"#]) { s += 25 }
        if matches(t, [#"(i.ll|gonna) (beat|hurt) you"#, #"watch your back"#, #"you.re dead"#,
                        #"jeg (tæver|smadrer) dig"#, #"du er (død|færdig)"#]) { s += 35 }
        return min(s, 100)
    }

    private func scoreSelfHarm(_ t: String) -> Double {
        var s: Double = 0
        if matches(t, [#"want to (die|disappear|end it)"#, #"don.t want to (be alive|live)"#,
                        #"better off dead"#, #"jeg vil (dø|ikke leve)"#]) { s += 50 }
        if matches(t, [#"(nobody|no one) (cares|would notice)"#, #"can.t (take|do) (this|it) anymore"#,
                        #"ingen ville savne mig"#, #"jeg kan ikke mere"#]) { s += 40 }
        if matches(t, [#"(pills|overdose|bridge|rope|blade|razor)"#, #"(suicide|suicidal)"#,
                        #"(piller|overdosis|selvmord)"#]) { s += 45 }
        return min(s, 100)
    }

    private func scoreViolence(_ t: String) -> Double {
        var s: Double = 0
        if matches(t, [#"(bring|bringing|have) a (gun|knife|weapon)"#, #"(shoot|stab|bomb|blow up)"#,
                        #"they.ll (all )?pay"#, #"de skal (alle )?betale"#]) { s += 50 }
        if matches(t, [#"(plan|planning|gonna).*(attack|hurt|kill)"#,
                        #"(planlægger|vil|skal).*(angribe|dræbe)"#]) { s += 45 }
        return min(s, 100)
    }

    private func scoreContentWellness(_ t: String) -> Double {
        var s: Double = 0
        if matches(t, [#"i(.m| am) (so )?(fat|ugly|disgusting)"#, #"thigh gap"#, #"body check"#,
                        #"pro.?ana"#, #"thinspo"#, #"jeg er (så )?(fed|grim)"#]) { s += 40 }
        if matches(t, [#"blackout challenge"#, #"choking (game|challenge)"#, #"dare me to"#]) { s += 50 }
        if matches(t, [#"porn"#, #"onlyfans"#, #"nsfw"#, #"nudes"#, #"xxx"#,
                        #"porno"#, #"nøgenbilleder"#]) { s += 50 }
        if matches(t, [#"fake id"#, #"falsk id"#, #"where.*(buy|get).*(weed|molly|xanax)"#]) { s += 40 }
        return min(s, 100)
    }

    private func matches(_ text: String, _ patterns: [String]) -> Bool {
        patterns.contains { p in
            (try? NSRegularExpression(pattern: p, options: .caseInsensitive))
                .flatMap { $0.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) } != nil
        }
    }
}
