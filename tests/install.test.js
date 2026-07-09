import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, installInstructionKey, isStandalone } from '../install.js';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  winEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  firefoxWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
};

describe('install — platform detection', () => {
  test('iPhone / iPad → ios', () => {
    assert.equal(detectPlatform(UA.iphone), 'ios');
    assert.equal(detectPlatform(UA.ipad), 'ios');
  });
  test('iPadOS in desktop mode (Mac UA + touch) → ios', () => {
    assert.equal(detectPlatform(UA.ipadDesktopMode, 5), 'ios');
  });
  test('macOS Safari (no touch) → mac_safari', () => {
    assert.equal(detectPlatform(UA.macSafari, 0), 'mac_safari');
  });
  test('Chrome / Edge → chromium', () => {
    assert.equal(detectPlatform(UA.macChrome), 'chromium');
    assert.equal(detectPlatform(UA.winEdge), 'chromium');
  });
  test('Android → android', () => {
    assert.equal(detectPlatform(UA.android), 'android');
  });
  test('Firefox / unknown → other', () => {
    assert.equal(detectPlatform(UA.firefoxWin), 'other');
    assert.equal(detectPlatform(''), 'other');
  });
});

describe('install — instruction key per platform', () => {
  test('each platform maps to its instruction, unknown falls back', () => {
    assert.equal(installInstructionKey('ios'), 'install.ins_ios');
    assert.equal(installInstructionKey('mac_safari'), 'install.ins_mac');
    assert.equal(installInstructionKey('chromium'), 'install.ins_chromium');
    assert.equal(installInstructionKey('android'), 'install.ins_android');
    assert.equal(installInstructionKey('other'), 'install.ins_generic');
    assert.equal(installInstructionKey(undefined), 'install.ins_generic');
  });
});

describe('install — standalone detection', () => {
  test('standalone display-mode or iOS navigator.standalone', () => {
    const mk = (matches, navStandalone) => ({
      matchMedia: q => ({ matches: q === '(display-mode: standalone)' && matches }),
      navigator: { standalone: navStandalone },
    });
    assert.equal(isStandalone(mk(false, undefined)), false);
    assert.equal(isStandalone(mk(true, undefined)), true);
    assert.equal(isStandalone(mk(false, true)), true);
  });
});
