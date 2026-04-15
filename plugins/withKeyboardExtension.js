const { withXcodeProject, withEntitlementsPlist } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin — adds CustorianKeyboard extension to the Xcode project.
 * Runs during `eas build` prebuild phase.
 */
function withKeyboardExtension(config) {
  // Add App Group entitlement to main app
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = ['group.com.custorian.app'];
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const targetName = 'CustorianKeyboard';
    const extensionBundleId = 'com.custorian.app.keyboard';
    const platformRoot = config.modRequest.platformProjectRoot;

    // Check if target already exists
    const existingTarget = project.pbxTargetByName(targetName);
    if (existingTarget) {
      console.log(`[CustorianKeyboard] Target already exists, skipping.`);
      return config;
    }

    console.log(`[CustorianKeyboard] Adding keyboard extension target...`);

    // Copy extension files to the ios build directory
    const srcDir = path.resolve(__dirname, '..', 'ios', 'CustorianKeyboard');
    const destDir = path.join(platformRoot, 'CustorianKeyboard');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy Swift source and Info.plist
    ['KeyboardViewController.swift', 'Info.plist'].forEach(file => {
      const src = path.join(srcDir, file);
      const dest = path.join(destDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[CustorianKeyboard] Copied ${file}`);
      } else {
        console.warn(`[CustorianKeyboard] Missing: ${src}`);
      }
    });

    // Create entitlements for the extension
    const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.custorian.app</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(path.join(destDir, `${targetName}.entitlements`), entitlements);

    // Add the extension target
    const target = project.addTarget(
      targetName,
      'app_extension',
      targetName,
      extensionBundleId
    );

    if (!target) {
      console.error('[CustorianKeyboard] Failed to add target');
      return config;
    }

    // Add source group
    const group = project.addPbxGroup(
      ['KeyboardViewController.swift', 'Info.plist', `${targetName}.entitlements`],
      targetName,
      targetName
    );

    // Add to main project
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(group.uuid, mainGroupId);

    // Add Swift file to compile sources
    project.addSourceFile(
      `${targetName}/KeyboardViewController.swift`,
      { target: target.uuid },
      group.uuid
    );

    // Configure build settings for the extension target
    const configs = project.pbxXCBuildConfigurationSection();
    for (const key in configs) {
      const bc = configs[key];
      if (bc && bc.buildSettings && bc.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === `"${extensionBundleId}"`) {
        bc.buildSettings.SWIFT_VERSION = '5.0';
        bc.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
        bc.buildSettings.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
        bc.buildSettings.INFOPLIST_FILE = `${targetName}/Info.plist`;
        bc.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
        bc.buildSettings.PRODUCT_NAME = `"${targetName}"`;
      }
    }

    console.log(`[CustorianKeyboard] Extension target added successfully.`);
    return config;
  });

  return config;
}

module.exports = withKeyboardExtension;
