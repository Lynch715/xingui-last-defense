import Foundation
import CoreImage
import AppKit

func fail(_ message: String) -> Never {
    FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
    exit(1)
}

guard CommandLine.arguments.count >= 3 else {
    fail("Usage: qr_tool.swift encode <text> <output.png> | decode <image.png>")
}

let mode = CommandLine.arguments[1]

if mode == "encode" {
    guard CommandLine.arguments.count >= 4 else { fail("Missing text or output path") }
    let text = CommandLine.arguments[2]
    let output = CommandLine.arguments[3]
    guard let data = text.data(using: .utf8), let filter = CIFilter(name: "CIQRCodeGenerator") else {
        fail("Unable to create QR filter")
    }
    filter.setValue(data, forKey: "inputMessage")
    filter.setValue("H", forKey: "inputCorrectionLevel")
    guard let image = filter.outputImage else { fail("Unable to render QR image") }
    let scaled = image.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
    let context = CIContext(options: [.useSoftwareRenderer: true])
    guard let cg = context.createCGImage(scaled, from: scaled.extent) else { fail("Unable to create QR bitmap") }
    let rep = NSBitmapImageRep(cgImage: cg)
    guard let png = rep.representation(using: .png, properties: [:]) else { fail("Unable to encode PNG") }
    try png.write(to: URL(fileURLWithPath: output))
    print(output)
} else if mode == "decode" {
    let path = CommandLine.arguments[2]
    guard let image = CIImage(contentsOf: URL(fileURLWithPath: path)) else { fail("Unable to read image") }
    guard let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: nil,
                                    options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]) else {
        fail("Unable to create QR detector")
    }
    let messages = detector.features(in: image).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
    guard !messages.isEmpty else { fail("No QR code detected") }
    messages.forEach { print($0) }
} else {
    fail("Unknown mode: \(mode)")
}
