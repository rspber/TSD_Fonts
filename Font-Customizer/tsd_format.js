/*
  tsd_format

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

function toHex00(v) {
  if (v < 0) {
    v = 256 + v;
  }
  return ('00' + v.toString(16).toUpperCase()).slice(-2)
}

function toHex(v) {
  return '0x' + toHex00(v)
}

function hexchar(c) {
  return (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f')
}

function pfxhex(pfx) {
   switch (pfx.length) {
     case 0: return [];
     case 3:
     case 1: return '';
     case 2:
       if (hexchar(pfx[0]) && hexchar(pfx[1])) {
         let c1 = parseInt(pfx, 16)
         return c1 >= 0xc0 && c1 <= 0xdf ? [c1] : ''
       }
       else {
         return '';
       }
     case 4:
       if (hexchar(pfx[0]) && hexchar(pfx[1]) && hexchar(pfx[2]) && hexchar(pfx[3])) {
         let c1 = parseInt(pfx.substring(0,2), 16)
         let c2 = parseInt(pfx.substring(2,4), 16)
         return c1 >= 0xe0 && c2 >= 0x80 && c2 <= 0xbf ? [c1, c2] : ''
       }
       else {
         return '';
       }
     case 5:
       if (hexchar(pfx[0]) && hexchar(pfx[1]) && pfx[2] == ' ' && hexchar(pfx[3]) && hexchar(pfx[4])) {
         let c1 = parseInt(pfx.substring(0,2), 16)
         let c2 = parseInt(pfx.substring(3,5), 16)
         return c1 >= 0xe0 && c2 >= 0x80 && c2 <= 0xbf ? [c1, c2] : ''
       }
       else {
         return '';
       }
     default:
       return '';
   }
}

function utf8table(pfx, code) {
  let tt = pfxhex(pfx)
  if (!Array.isArray(tt) || !code) {
    return '';
  }
  else {
    if (tt.length > 0) {
      if (code >= 0x80 && code <= 0xbf) {
        tt.push(code)
      }
      else {
        return ''
      }
    }
    else {
      tt.push(code)
    }
    return tt
  }
}

function utf8value(pfx, code) {
  let tt = utf8table(pfx, code)
  if (Array.isArray(tt)) {
    let s = ''
    for (i = 0; i < tt.length; ++i) {
      let t = tt[i]
      s += ' ' + toHex(t) + ','
    }
    return s
  }
  return ''
}

function unicode(pfx, code) {
  let tt = utf8table(pfx, code)
  if (Array.isArray(tt)) {
    let v = 0
    switch (tt.length) {
      case 3:
      {
        let c1 = tt[0]
        let c2 = tt[1]
        let c3 = tt[2]
        if (c1 < 0xe1 && c2 < 0xa0) {
          return NaN;
        }
        v = ((c1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f)
        break;
      }
      case 2:
      {
        let c1 = tt[0]
        let c2 = tt[1]
        if (c1 < 0xc4) {
          return NaN;
        }
        v = ((c1 & 0x1f) << 6) | (c2 & 0x3f)
        break;
      }
      default:
        v = tt[0]
    }
    return v
  }
  return -1
}

function unicodevalue(pfx, code) {
  let u = unicode(pfx, code)
  return isNaN(u) ? 'ureachable' : u < 0 ? '' : '0x' + ('0000' + u.toString(16)).slice(-4)
}

function ucharvalue(pfx, code) {
  if (code < 0x20) {
    return toHex(code)
  }
  else {
    let u = unicode(pfx, code)
    return isNaN(u) ? 'unreachable' : u < 0 ? '' : String.fromCharCode(u)
  }
}

function fillUCodeAndUtf8(pfx, charInput){
  const char = charInput.nextSibling;
  const ucode = char.nextSibling;
  const utf8 = ucode.nextSibling;
  const code = parseInt(charInput.value, 16)
  char.value = ucharvalue(pfx.value, code)
  ucode.value = unicodevalue(pfx.value, code)
  utf8.value = utf8value(pfx.value, code).toLowerCase()
}

function newCharsChanged(pfx, firstInput, lastInput) {
  fillUCodeAndUtf8(pfx, firstInput)
  fillUCodeAndUtf8(pfx, lastInput)
}

function signedByte(v) {
  return v < 128 ? v : v - 256
}

function tsd_glyph(utf8_pfx, code, bpp, ver, w, h, xadv, xo, yo, bitmap)
{
  const len = bitmap.length
  let out = '  ' + toHex(code) + ', ' + toHex(bpp) + ', ' + ver + ', ' + w + ', ' + h + ', ' + xadv + ', '
    + toHex(xo).toLowerCase() + ', ' + toHex(yo).toLowerCase() + ', '
    + (len & 0xff) + ', ' + (len >> 8) + ','

  let j = 9
  for (let b of bitmap) {
    out += ' ' + toHex(b) + ','
    if (++j >= 15) {
      out += '\n   '
      j = 0
    }
  }
  let comment = ' // ' + '\'' + ucharvalue(utf8_pfx, code) + '\''
  if (utf8_pfx != '') {
    j += (utf8_pfx.length >> 1)
    comment += utf8value(utf8_pfx, code)
  }
  if (j > 14) {
    out += '\n    '
  }
  return out + comment
}

function tsd_fract(fname, fract, utf8_pfx, first, last, height, glyphs)
{
  let c1 = '0x00'
  let c2 = '0x00'
  if (utf8_pfx.length >= 2) {
    c1 = '0x' + utf8_pfx.substring(0, 2)
    if (utf8_pfx.length >= 4) {
      const i = 2 + (utf8_pfx.length > 4 ? 1 : 0)
      c2 = '0x' + utf8_pfx.substring(i, i + 2)
    }
  }
  return '' +
  'static const uint8_t ' + fname + '_Glyphs_' + fract + '[] {\n' + glyphs + '\n' + '0};\n\n' +
  'static const GFXfont ' + fname + '_' + fract + ' {\n' +
    '  ' + fname + '_Glyphs_' + fract + ',\n' +
    '  ' + c1 + ', ' + c2 + ', ' + '0' + ', ' + toHex(first) + ', ' + toHex(last) + ', ' + height + '\n' +
  '};\n'
}

function tsd_font(fname, fracts)
{
  const tt = []
  for (let f of fracts) {
    tt.push('  &' + fname + '_' + f + ',')
  }
  return 'static const GFXfont* ' + fname + '[] {\n' + tt.join('\n') + '\n  0\n};'
}
