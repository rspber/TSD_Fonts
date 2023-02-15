/*
  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/
// no compression default
ver = 1;

function setver(e)
{
  ver = 1 - (e.target.checked ? 1 : 0)
  document.getElementById('load').value = null
  document.getElementById('data').textContent = null
}

function extract_array(data, idx, rx)
{
  let fx = data.substring(idx).match(rx)
  if (fx) {
    let i = data.indexOf(fx[0], idx) + fx[0].length
    let j = data.indexOf('};', i)
    if (j > 0) {
      let tx = data.substring(i, j)
      tx = tx.replace(/#if.*?\n(.*?)(#else(.*))?(#endif)/sig, '$1')
      let a = 3
      while (a < arguments.length) {
        const ra = arguments[a++]
        const va = arguments[a++]
        tx = tx.replace(ra, va)
      }
      tx = tx.replace(/\{/g, '[').replace(/\}/g, ']')
      return { fx: fx, data: eval( '[' + tx + ']'), eidx: j+2 }
    }
  }
  return null
}

function store_content(font_name, tt, ff)
{
  document.getElementById('tsdfname').textContent = 'TSD_' + font_name + '.h'
  document.getElementById('result').textContent = tt.join('\n') + '\n' + tsd_font(font_name, ff)
}

function proc_file()
{
  const data = this.result;

  // Adafruit GFX
  {
    const bi = extract_array(data, 0, /const\s+uint8_t\s+(\w+)Bitmaps\[\]\s*\w*\s*\=\s*\{/)
    if (bi) {
      const  gl = extract_array(data, bi.eidx, /const\s+GFXglyph\s+(\w+)Glyphs\[\]\s*\w*\s*\=\s*\{/)
      if (gl && bi.fx[1] === gl.fx[1]) {
        const fo = extract_array(data, gl.eidx, /const\s+GFXfont\s+(\w+)\s*\w*\s*\=\s*\{/, /\(\w+\s*\*\)\w+/g, '-1')
        if (fo && bi.fx[1] === fo.fx[1]) {
          document.getElementById('data').textContent = data
          let code0 = fo.data[2]
          let code = code0
          const tt = []
          const ff = []
          let tg = []
          const font_name = bi.fx[1]
          const font_height = fo.data[4]
          const utf8_pfx = ''
          gl.data.push([bi.data.length])
          const to = gl.data.length - 1
          for (let i = 0; i < to; ++i) {
            const g = gl.data[i]
            const w = g[1]
            const h = g[2]
            const xadv = g[3]
            const xo = g[4]
            const yo = 1 - g[5]
            let bitmap = bi.data.slice(g[0], gl.data[i+1][0])
            if (ver == 1) {   // decompress
              bitmap = font0_font1(bitmap, w, h)
            }
            tg.push(tsd_glyph('', code++, 0, ver, w, h, xadv, xo, yo, bitmap))
            if (code - code0 >= 0x20) {
              ff.push(toHex00(code0))
              tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tg.join('\n')))
              tg = []
              code0 = code
            }
          }
          if (code > code0) {
            ff.push(toHex00(code0))
            tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tg.join('\n')))
          }

          store_content(font_name, tt, ff)
          return
        }
      }
    }
  }

  // STMicroelectronics sFONT, waveshare
  {
    const bi = extract_array(data, 0, /const\s+uint8_t\s+(\w+)_Table\s*\[\]\s*\=\s*\{/)
    if (bi) {
      const fo = extract_array(data, bi.eidx, /sFONT\s+(\w+)\s*\=\s*\{/, /\w+_\w+/g, '-1')
      if (fo) {
        document.getElementById('data').textContent = data
        const font_name = bi.fx[1]
        const w = fo.data[1]
        const h = fo.data[2]
        const rh = /\w+[A-Z_a-z]+(\d+)/
        const fh = font_name.match(rh)
        const font_height = parseInt(fh[1])
        const tt = []
        const ff = []
        let code0 = 0x20
        let code = code0
        let tb = []
        const d = h * ((w + 7) >> 3)
        for (let p = 0; d && p + d <= bi.data.length; p += d) {
          let bitmap = bi.data.slice(p, p + d)
          if (ver == 0) {   // compress
            bitmap = font1_font0(bitmap, w, h)
          }
          tb.push(tsd_glyph('', code++, 0, ver, w, h, w, 0, font_height - 6, bitmap))
          if (code - code0 >= 0x20) {
            ff.push(toHex00(code0))
            tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
            tb = []
            code0 = code
          }
        }
        if (code > code0) {
          ff.push(toHex00(code0))
          tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
        }

        store_content(font_name, tt, ff)
        return
      }
    }
  }
/*
  // STMicroelectronics cFONT, waveshare
  {
    const bi = extract_array(data, 0, /const\s+CH_CN\s+(\w+)_Table\s*\[\]\s*\=\s*\{/)
    if (bi) {
      const fo = extract_array(data, bi.eidx, /cFONT\s+(\w+)\s*\=\s*\{/, /\w+_\w+/g, '-1', /sizeof\(.*\)\/sizeof\(.*\)/, '-1')
      if (fo) {
        document.getElementById('data').textContent = data
        const font_name = bi.fx[1]
        const w = fo.data[2]
        const h = fo.data[3]
        const font_height = fo.data[4]
        const tt = []
        const ff = []
        let code0 = !!! unicode char is in row[0] !!!
        let code = code0
        let tb = []
        for (let row of bi.data) {
          let bitmap = row[1]
          if (ver == 0) {   // compress
            bitmap = font1_font0(bitmap, w, h)
          }
          tb.push(tsd_glyph('', code++, 0, ver, w, h, w, 0, 0, bitmap))
          if (code - code0 >= 0x20) {
            ff.push(toHex00(code0))
            tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
            tb = []
            code0 = code
          }
        }
        if (code > code0) {
          ff.push(toHex00(code0))
          tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
        }

        store_content(font_name, tt, ff)
        return
      }
    }
  }
*/
/*
  // ILI9341_t3_font_t
  {
    function unpack_index(bitnx, bits_index)
    {
      let nx = []
      let i = 0
      let b = 0
      let d = 0
      let c = 0
      let j = 0
      while (i < bitnx.length) {
        if (!b) {
          d = bitnx[i++]
          b = 0x80
        }
        c = (c << 1) | (d & b ? 1 : 0)
        b >>= 1
        if (++j >= bits_index) {
          nx.push(c)
          c = 0
          j = 0
        }
      }
      return nx
    }

    const f = {
      bits: [],
      d: 0,
      b: 0,
      j: 0,
      get: function (n) {
        let v = 0
        for (let i = 0; i < n; ++i) {
          if (!this.b) {
            this.d = this.bits[this.j++]
            this.b = 0x80
          }
          v = (v << 1) | (this.d & this.b ? 1 : 0)
          this.b >>= 1
        }
        return v
      },
      rest: function () {
        let bb = []
        let v = 0
        let n = 0
        while (this.b || this.j < this.bits.length) {
          if (!this.b) {
            this.d = this.bits[this.j++]
            this.b = 0x80
          }
          v = (v << 1) | (this.d & this.b ? 1 : 0)
          this.b >>= 1
          if (++n >= 8) {
            bb.push(v)
            v = 0
            n = 0
          }
        }
        return bb
      },
      init: function (bits) {
        this.bits = bits;
        this.d = this.b = this.j = 0
      }
    }

    let idx = 0
    let da = extract_array(data, idx, /\w*\s*const\s+\w*\s*\w*\s*(\w+)_data\s*\[\]\s*\=\s*\{/)
    if (da) {
      let dx = extract_array(data, da.eidx, /\w*\s*const\s+\w*\s*\w*\s*(\w+)_index\s*\[\]\s*\=\s*\{/)
      if (dx) {
        let fo = extract_array(data, dx.eidx, /const\s+ILI9341_t3_font_t\s+(\w+)\s*\=\s*\{/, /\w+_\w+/g, '-1')
        if (fo) {
          document.getElementById('data').textContent = data
          const font_name = da.fx[1]
          // unpack index
          let code0 = fo.data[5]
          let code = code0
          const font_height = fo.data[16]
          const tt = []
          const ff = []
          let tg = []
          let nx = unpack_index(dx.data, fo.data[9])
          nx.push(da.data.length)
          const to = nx.length - 1
          for (i = 0; i < to; ++i) {
            f.init(da.data.slice(nx[i], nx[i+1]))
            const encoding = f.get(3)
            const w = f.get(fo.data[10])
            const h = f.get(fo.data[11])
            const xo = f.get(fo.data[12])
            const yo = - font_height + f.get(fo.data[13])
            const delta = f.get(fo.data[14])
            const xadv = delta
            let bitmap = f.rest()

            !!! unknown bits compression !!!

//            if (ver == 0) {   // compress
//              bitmap = font1_font0(bitmap, w, h)
//            }
            tg.push(tsd_glyph('', code++, 0, ver, w, h, xadv, xo, yo, bitmap))
            if (code - code0 >= 0x20) {
              ff.push(toHex00(code0))
              tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tg.join('\n')))
              tg = []
              code0 = code
            }
          }
          if (code > code0) {
            ff.push(toHex00(code0))
            tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tg.join('\n')))
          }

          store_content(font_name, tt, ff)
          return
        }
      }
    }
  }
*/
  // TFT_eSPI
  {
    const widtbl = extract_array(data, 0, /\w*\s*const\s+\w*\s*\w*\s*widtbl_(\w+)\s*\[(\d*)\]\s*\=(.|\n)*?\{/)
    if (widtbl) {
      const tchr = []
      let idx = widtbl.eidx
      let i = 0
      while (true) {
        const chr = extract_array(data, idx, /\w*\s*const\s+\w*\s*\w*\s*chr_(\w+)_(\w+)\s*\[(\d*)\]\s*\=(.|\n)*?\{/)
        if (chr) {
          tchr.push([parseInt(chr.fx[2], 16), widtbl.data[i++], chr.data])
          idx = chr.eidx
        }
        else {
          break
        }
      }
      document.getElementById('data').textContent = data
      const font_name = widtbl.fx[1]
      let h = 0
      let baseline = 0
      let w = 8
      switch (font_name) {
        case 'f16': h = 16, baseline = 13; break;
        case 'f32': h = 26, baseline = 19; break;
        case 'f64': h = 48, baseline = 36; break;
        case 'f72': h = 75, baseline = 73; break;
        case 'f7s': h = 48, baseline = 47; break;
      }
      const font_height = h
      const tt = []
      const ff = []
      let code0 = tchr[0][0]
      let code = code0
      let tb = []
      for (let chr of tchr) {
        code = chr[0]
        if (code - code0 >= 0x20) {
          ff.push(toHex00(code0))
          tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
          tb = []
          code0 = code
        }
        const xadv = chr[1]
        let bitmap = chr[2]
        let bpp = 0
        if (font_name === 'f16') {
          if (ver == 0) {   // compress
            bitmap = font1_font0(bitmap, w, h)
          }
        }
        else {
          bitmap = bitmap.slice(1, bitmap.length-1)
          bpp = 2
        }
        tb.push(tsd_glyph('', code, bpp, ver, w, h, xadv, 0, baseline, bitmap))
      }
      if (code > code0) {
        ff.push(toHex00(code0))
        tt.push(tsd_fract(font_name, toHex00(code0), font_height, '', code0, code-1, tb.join('\n')))
      }

      store_content(font_name, tt, ff)
      return
    }
  }

}

function saveFile()
{
  const link = document.createElement("a")
  const file = new Blob([document.getElementById('result').textContent], { type: 'text/plain' })
  link.href = URL.createObjectURL(file)
  link.download = document.getElementById('tsdfname').textContent
  link.click()
  URL.revokeObjectURL(link.href)
}

// main

document.getElementById('load').addEventListener('change',
  function() {
    with (new FileReader()) {
      onload = proc_file
      readAsText(this.files[0])
    }
  }
);
