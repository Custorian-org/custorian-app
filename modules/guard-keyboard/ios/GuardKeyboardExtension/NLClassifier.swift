import NaturalLanguage

/**
 * On-device text classification using Apple's NaturalLanguage framework.
 * No network calls — runs entirely on the device's Neural Engine.
 *
 * Capabilities:
 * - Sentiment analysis (positive/negative/neutral)
 * - Language detection (auto-detect Danish vs English)
 * - Named entity recognition (detect when child shares personal info)
 * - Custom classifier (trained with Create ML — add .mlmodel file)
 *
 * Usage in Custodian:
 * 1. Sentiment analysis flags negative emotional spirals (bullying, self-harm)
 * 2. Entity recognition detects PII sharing (names, locations, schools)
 * 3. Language detection routes to correct pattern engine (EN vs DA)
 * 4. Custom model (future) classifies grooming/threat intent
 */
class NLClassifier {
    static let shared = NLClassifier()

    // MARK: - Sentiment Analysis

    /// Returns sentiment score: -1.0 (very negative) to +1.0 (very positive)
    func analyzeSentiment(_ text: String) -> Double {
        let tagger = NLTagger(tagSchemes: [.sentimentScore])
        tagger.string = text
        let (tag, _) = tagger.tag(at: text.startIndex,
                                   unit: .paragraph,
                                   scheme: .sentimentScore)
        return Double(tag?.rawValue ?? "0") ?? 0
    }

    /// Flags if text is strongly negative (potential bullying/self-harm context)
    func isStronglyNegative(_ text: String) -> Bool {
        return analyzeSentiment(text) < -0.6
    }

    // MARK: - Language Detection

    /// Detect primary language of text
    func detectLanguage(_ text: String) -> String? {
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        return recognizer.dominantLanguage?.rawValue
    }

    /// Check if text is Danish
    func isDanish(_ text: String) -> Bool {
        return detectLanguage(text) == "da"
    }

    // MARK: - Named Entity Recognition (PII Detection)

    struct DetectedEntity {
        let type: String     // PersonalName, PlaceName, OrganizationName
        let value: String
        let range: Range<String.Index>
    }

    /// Extract personal information entities from text
    func extractEntities(_ text: String) -> [DetectedEntity] {
        let tagger = NLTagger(tagSchemes: [.nameType])
        tagger.string = text

        var entities: [DetectedEntity] = []
        let options: NLTagger.Options = [.omitPunctuation, .omitWhitespace]

        tagger.enumerateTags(in: text.startIndex..<text.endIndex,
                            unit: .word,
                            scheme: .nameType,
                            options: options) { tag, range in
            guard let tag = tag else { return true }

            let entityType: String
            switch tag {
            case .personalName: entityType = "PersonalName"
            case .placeName: entityType = "PlaceName"
            case .organizationName: entityType = "OrganizationName"
            default: return true
            }

            entities.append(DetectedEntity(
                type: entityType,
                value: String(text[range]),
                range: range
            ))
            return true
        }

        return entities
    }

    /// Check if text contains PII (names, locations, organizations)
    func containsPII(_ text: String) -> Bool {
        let entities = extractEntities(text)
        return entities.contains { $0.type == "PersonalName" || $0.type == "PlaceName" }
    }

    // MARK: - Custom ML Model (Create ML)

    /// Load a custom trained model for threat classification.
    /// Train with Create ML using labeled grooming/bullying/safe text data.
    /// Export as .mlmodel → add to Xcode project → reference here.
    ///
    /// Training data format (CSV):
    ///   text,label
    ///   "send me a pic don't tell anyone",grooming
    ///   "you're ugly nobody likes you",bullying
    ///   "want to play roblox later?",safe
    ///
    /// Steps:
    /// 1. Open Create ML in Xcode (Xcode → Open Developer Tool → Create ML)
    /// 2. New Project → Text Classifier
    /// 3. Import CSV training data
    /// 4. Train → export CustodianClassifier.mlmodel
    /// 5. Add .mlmodel to Xcode project
    /// 6. Uncomment code below

    /*
    private lazy var customModel: NLModel? = {
        guard let modelURL = Bundle.main.url(forResource: "CustodianClassifier",
                                              withExtension: "mlmodelc"),
              let model = try? NLModel(contentsOf: modelURL) else {
            return nil
        }
        return model
    }()

    func classifyThreat(_ text: String) -> (label: String, confidence: Double)? {
        guard let model = customModel else { return nil }
        guard let label = model.predictedLabel(for: text) else { return nil }

        let hypotheses = model.predictedLabelHypotheses(for: text, maximumCount: 5)
        let confidence = hypotheses[label] ?? 0

        return (label: label, confidence: confidence)
    }
    */

    // MARK: - Compound Analysis

    struct AnalysisResult {
        let sentiment: Double
        let language: String
        let piiDetected: Bool
        let entities: [DetectedEntity]
        let isHighRisk: Bool
    }

    /// Run full on-device analysis pipeline
    func fullAnalysis(_ text: String) -> AnalysisResult {
        let sentiment = analyzeSentiment(text)
        let language = detectLanguage(text) ?? "unknown"
        let entities = extractEntities(text)
        let hasPII = entities.contains { $0.type == "PersonalName" || $0.type == "PlaceName" }

        // High risk = very negative sentiment + PII sharing
        let isHighRisk = sentiment < -0.5 && hasPII

        return AnalysisResult(
            sentiment: sentiment,
            language: language,
            piiDetected: hasPII,
            entities: entities,
            isHighRisk: isHighRisk
        )
    }
}
