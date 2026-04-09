const { withXcodeProject, withInfoPlist } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin that adds the GuardKeyboard extension target to the Xcode project.
 * This runs during `npx expo prebuild` and wires in the Swift keyboard extension.
 */
function withKeyboardExtension(config) {
  // Add App Group entitlement to main app
  config = withInfoPlist(config, (config) => {
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const targetName = 'GuardKeyboardExtension';

    // Check if target already exists
    const existingTarget = project.pbxTargetByName(targetName);
    if (existingTarget) {
      console.log(`[GuardKeyboard] Target ${targetName} already exists, skipping.`);
      return config;
    }

    console.log(`[GuardKeyboard] Adding ${targetName} target to Xcode project...`);

    // Add the app extension target
    const target = project.addTarget(
      targetName,
      'app_extension',
      'GuardKeyboardExtension',
      'com.guardlayer.app.GuardKeyboardExtension'
    );

    // Add source files
    const extensionDir = path.resolve(
      __dirname,
      '../modules/guard-keyboard/ios/GuardKeyboardExtension'
    );

    const group = project.addPbxGroup(
      ['KeyboardViewController.swift', 'RiskAnalyzer.swift', 'Info.plist'],
      targetName,
      extensionDir
    );

    // Add group to main project group
    const mainGroup = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(group.uuid, mainGroup);

    // Add source files to compile phase
    const files = ['KeyboardViewController.swift', 'RiskAnalyzer.swift'];
    for (const file of files) {
      project.addSourceFile(
        path.join(extensionDir, file),
        { target: target.uuid },
        group.uuid
      );
    }

    // Set build settings
    const configs = project.pbxXCBuildConfigurationSection();
    for (const key in configs) {
      const config_item = configs[key];
      if (config_item.buildSettings && config_item.name) {
        const bs = config_item.buildSettings;
        if (bs.PRODUCT_BUNDLE_IDENTIFIER === 'com.guardlayer.app.GuardKeyboardExtension') {
          bs.SWIFT_VERSION = '5.0';
          bs.IPHONEOS_DEPLOYMENT_TARGET = '15.0';
          bs.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
        }
      }
    }

    console.log(`[GuardKeyboard] Target ${targetName} added successfully.`);
    return config;
  });

  return config;
}

module.exports = withKeyboardExtension;
