/*
  Font-Customizer 4.0

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

function resizePixels (t)
{
  const g = t.glyph
  const pixels = g.tb

  let w = g.w
  let h = g.h

  if (h < pixels.length) {
    pixels.length = h
  }
  while (h > pixels.length) {
    pixels.push(new Uint8Array(w))
  }

  for (let j = 0; j < pixels.length; ++j) {
    const c = pixels[j]
    if (c.length != w) {
      const d = new Uint8Array(w)
      for (let i = w < c.length ? w : c.length; --i >= 0; ) {
        d[i] = c[i]
      }
      pixels[j] = d
    }
  }

  rebuildGlyphTable(t);
}

function eTargetT(e)
{
  e = e.target
  while (e) {
    if (e.hasOwnProperty('glyph')) {
      return e;
    }
    if (e.hasOwnProperty('t')) {
      return e.t;
    }
    e = e.parentElement
  }
}

function getPixel(t, cell)
{
  const g = t.glyph
  const x = cell.x - g.xo;
  const y = cell.y - (g.ft.maxBaseline + g.yo)
  const pixels = g.tb

  if (y >= 0 && y < pixels.length) {
    const pxrow = pixels[y]
    if (x >= 0 && x < pxrow.length) {
      return pxrow[x]
    }
  }
}

function setBackground(cell, v)
{
  let c = 255 - v
  let cc = c < 232 ? c + 24 : 255
  cell.style.backgroundColor = 'rgb(' + c + ',' + cc + ',' + c + ')'
}

function setPixelColor(t, cell, fill)
{
  const g = t.glyph
  const x = cell.x - g.xo;
  const y = cell.y - (g.ft.maxBaseline + g.yo)
  const pixels = g.tb

  if (y >= 0 && y < pixels.length) {
    const pxrow = pixels[y]
    if (x >= 0 && x < pxrow.length) {
      const prev = pxrow[x]
      removeClass(cell, 'dead')
      removeClass(cell, 'over')
      addClass(cell, 'fill')
      if (!(fill === undefined || fill === false)) pxrow[x] = fill
      setBackground(cell, pxrow[x])
      if (cell.x >= g.xadv || cell.x < Math.max(0, g.xo)) {
        addClass(cell, 'over')
      }
      return prev
    }
  }
  cell.style.backgroundColor = ''
  removeClass(cell, 'over')
  removeClass(cell, 'fill')
  addClass(cell, 'dead')
}

function fill_cell(e)
{
  if (hasClass(e.target, 'fill')) {
    const t = eTargetT(e)
    if (!t.glyph.dis && d_palette.fill && d_palette.div.table == t) {
      const v = d_palette.fill.fill
      const prev = setPixelColor(t, e.target, v)
      pushAct(t, 'set', prev, v, e.target.x, e.target.y)
    }
  }
}

function pushAct(t, act, prev, next)
{
  t.undo.push([act, prev, next, arguments[4], arguments[5]])
  t.undoidx = t.undo.length
  t.undoBtn.disabled = false
  t.redoBtn.disabled = true
}

function act_(t, act, v, x, y)
{
  const g = t.glyph
  if (g.dis) {
    return
  }
  switch (act) {
    case 'rows':
      g.h += v
      if (g.h < 1) {
        g.h = 1
        return
      }
      resizePixels(t)
      return true
    case 'cols':
      g.w += v
      if (g.w < 1) {
        g.w = 1
        return
      }
      resizePixels(t)
      return true
    case 'base':
      g.yo += v
      rebuildGlyphTable(t)
      return true
    case 'xoff':
      g.xo += v
      rebuildGlyphTable(t)
      return true
    case 'xadv':
      g.xadv += v
      rebuildGlyphTable(t)
      return true
    case 'set':
      for (let row of t.children) {
        for (let cell of row.children) {
          if (cell.x == x && cell.y == y) {
            setPixelColor(t, cell, v)
            return true
          }
        }
      }
      return
  }
}

function actv(t, act, v)
{
  if (act_(t, act, v, undefined, undefined)) {
    pushAct(t, act, -v, v)
  }
}

function undo(e)
{
  const t = eTargetT(e)
  if (!t.glyph.dis && t.undoidx > 0) {
    const u = t.undo[--t.undoidx]
    act_(t, u[0], u[1], u[3], u[4])
    t.undoBtn.disabled = t.undoidx <= 0
    t.redoBtn.disabled = false
  }
}

function redo(e)
{
  const t = eTargetT(e)
  if (!t.glyph.dis && t.undoidx < t.undo.length) {
    const u = t.undo[t.undoidx++]
    act_(t, u[0], u[2], u[3], u[4])
    t.undoBtn.disabled = false
    t.redoBtn.disabled = t.undoidx >= t.undo.length
  }
}

function setupPaletteFill(e)
{
  d_palette.fill = e.target
  const t = d_palette.div.table
  setBackground(e.target.parentElement.parentElement.previousSibling.firstChild, e.target.fill, t.glyph.bpp)  // for seeing only
}

function makePalette(bpp)
{
  if (bpp == 0) { h = 2; w = 1; m = 255 } else
  if (bpp == 1) { h = 4; w = 1; m = 85 } else
  if (bpp == 2) { h = 16; w = 1; m = 17 } else
                { h = 16; w = 16; m = 1 }
  const p = element('table');
  p.style.width = 'max-content' // compact
  p.style.borderSpacing = '0px'
//  p.style.position = 'relative'
  for (let j = h; --j >= 0; ) {
    const row = element('tr', 'row')
    for (let i = w; --i >= 0; ) {
      let cell = element('td', 'cell')
      on(cell, 'click', setupPaletteFill)
      cell.fill = (j * w + i) * m
      setBackground(cell, cell.fill)
      append(row, cell)
    }
    append(p, row)
  }
  return p
}

function mark_palette(e)
{
  if (hasClass(e.target, 'fill')) {
    const t = eTargetT(e)
    if (d_palette.div && d_palette.div.table == t) {
      let fill = getPixel(t, e.target)
      if (fill > 0 && fill < 255) {
        let n = 4
        let b = 0xff
        while (--n >= 0) {
          let found = false
          for (let row of d_palette.div.childNodes) {
            for (let cell of row.childNodes) {
              if ((cell.fill & b) == (fill & b)) {
                cell.innerHTML = b == 0xff ? '\u26fd' : '\u2639'
                found = true
              }
            }
          }
          if (found) break
          b = b == 0xff ? 0xf0 : b == 0xf0 ? 0xc0 : 0x80
        }
      }
    }
  }
}

function unmark_palette(e)
{
  const c = e.target
  if (hasClass(c, 'fill')) {
    const t = eTargetT(e)
    if (d_palette.div && d_palette.div.table == t) {
      for (let row of d_palette.div.childNodes) {
        for (let cell of row.childNodes) {
          cell.innerHTML = null
        }
      }
    }
  }
}

function detachPalette(input)
{
  if (d_palette.checkInput) {
    d_palette.checkInput.parentElement.parentElement.div.innerHTML = null
    if (input != d_palette.checkInput) {
      d_palette.checkInput.checked = false
      d_palette.checkInput.nextSibling.disabled = true
      d_palette.checkInput.nextSibling.nextSibling.disabled = true
    }
    d_palette.checkInput = null
    d_palette.fill = null
    d_palette.div.table = null
  }
}

function appendPalette(input)
{
  if (input.checked) {
    d_palette.checkInput = input
    append(
      input.parentElement.parentElement.div,
      append(
        element('div', 'row'),
        (()=>{ let b = element('div', 'cell'); b.style.margin = '2px 2px 0px 0px'; b.style.flow = 'top'; return b })()
      ),
      d_palette.div
    )
  }
}

function attachPalette(e)
{
  const t = eTargetT(e)
  if (!d_palette.div || d_palette.div.table.bpp != t.glyph.bpp) {
    d_palette.div = makePalette(t.glyph.bpp)
  }
  detachPalette(e.target)
  appendPalette(e.target)
  d_palette.div.table = t
  e.target.nextSibling.disabled = !e.target.checked
  e.target.nextSibling.nextSibling.disabled = !e.target.checked
}

function changeDensity(t, input, v)
{
  v = t.glyph.bpp + v
  if (v < 0 || v > 3) {
    return
  }
  if (input.checked) {
    detachPalette(input)
    t.glyph.bpp = v
    d_palette.div = makePalette(t.glyph.bpp)
    appendPalette(input)
    d_palette.div.table = t
  }
}

function incDensity(e)
{
  changeDensity(eTargetT(e), e.target.previousSibling, +1)
}

function decDensity(e)
{
  changeDensity(eTargetT(e), e.target.previousSibling.previousSibling, -1)
}

function showGrid(e)
{
  const t = eTargetT(e)
  if (!t.glyph.dis) {
    t.showGrid = 1 - t.showGrid
    rebuildGlyphTable(t)
  }
}

function tr2td(label, value)
{
  return append(
    element('tr'),
    element('td', '', label),
    (()=>{ let d = element('td', '', value); d.style.float = 'right'; return d })()
  )
}

function tr4td(l1, v1, l2, v2)
{
  return append(
    element('tr'),
    element('td', '', l1),
    (()=>{ let d = element('td', '', v1); d.style.float = 'right'; return d })(),
    element('td', '', l2),
    (()=>{ let d = element('td', '', v2); d.style.float = 'right'; return d })()
  )
}

function glyph_info(t)
{
  const g = t.glyph
  return append(
    (()=>{ let d = element('table'); d.style.width = '100%'; d.style.fontSize = '0.8rem';  return d })(),
    tr4td('Rows', g.h, 'Cols', g.w),
    tr4td('Base',  g.yo, 'XAddv', g.xadv),
    tr4td('MaxBase', g.ft.maxBaseline, 'XOff', g.xo),
    tr4td('Baseline', g.ft.minUnderBaseline, 'Height', g.ft.height),
  )
}

function showGlyphInfo(e)
{
  const t = eTargetT(e)
  if (t.info) {
    remove(e.target.parentElement.parentElement, t.info)
    t.info = null
    return
  }
  append(
    e.target.parentElement.parentElement,
    append(
      (()=>{
        let d = element('div');
        d.style.zIndex = '1';
        d.style.position = 'absolute';
        d.style.top = '40px';
        d.style.width = '150px';
        d.style.backgroundColor = 'white';
        d.style.padding = '2px';
        d.style.boxShadow = '0px 1px 5px rgba(0, 0, 0, 0.35)';
        return t.info = d
      })(),
      glyph_info(t)
    )
  )
}

let isFilling = false

function cell_mousedown(e)
{
  isFilling = true;
  fill_cell(e)
}

function cell_mouseup(e)
{
  isFilling = false
}

function cell_mouseenter(e)
{
  if (isFilling)
    fill_cell(e)
}

function rebuildGlyphTable(t)
{
  if (t.info) {
    t.info.innerHTML= null
    append(t.info, glyph_info(t))
  }

  const g = t.glyph
  const xo = g.xo
  const xadv = g.xadv
  const w = g.w

  const maxBaseline = g.ft.maxBaseline
  const minUnderBaseline = g.ft.minUnderBaseline

  t.innerHTML = null
  const jmax = maxBaseline + 1 - minUnderBaseline
  const imin = Math.min(0, xo)
  const imax = Math.max(xadv, w + xo)
  for (let j = 0; j < jmax; ++j) {
    const row = element('div', 'row')
    for (let i = imin; i <= imax; ++i) {
      const cell = element('div', 'cell')
      if (t.showGrid) {
        if (i && !(i & 0x07)) addClass(cell, 'x8'); else
        if (i && !(i & 0x03)) addClass(cell, 'x4');
        if (j && !(j & 0x07)) addClass(cell, 'y8'); else
        if (j && !(j & 0x03)) addClass(cell, 'y4');
      }
      on(cell, 'mouseover', mark_palette)
      on(cell, 'mouseout', unmark_palette)
      on(cell, 'mousedown', cell_mousedown)
      on(cell, 'mouseup', cell_mouseup)
      on(cell, 'mouseenter', cell_mouseenter)
      cell.x = i
      cell.y = j
      if (i === 0 && j === 0) {
        t.before_xoffset = cell
      }
      if (j === 0 && i === xadv) {
        t.before_xadvance = cell
      }
      setPixelColor(t, cell)
      append(row, cell)
    }
    append(t, row)
  }

  return append(
    t,
    (()=>{ let b = element('div', 'limit'); b.style.left = t.before_xoffset.offsetLeft - 1; return b})(),
    (()=>{ let b = element('div', 'limit'); b.style.left = t.before_xadvance.offsetLeft - 1; return b})(),
    (()=>{ let b = element('div', 'baseline'); b.style.top = (maxBaseline + 1) * 10 - 1; return b})()
  )
}

let inteId = undefined

function upDownButton (name, on_click, color, width)
{
  return append(
    (()=>{ let b = element('div', 'ui mini compact buttons'); b.style.display = "inline"; b.style.margin = '1px'; return b})(),
    (()=>{
      let b = element('button', 'ui compact button ' + color, '-'); b.incdir = -1;
      on(b, 'mousedown', (e)=>{ clearInterval(inteId); on_click(e); inteId = setInterval(on_click, 100, e) });
      on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
      on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
      return b
    })(),
    (()=>{ let b = element('button', 'ui compact disabled button ' + color, name); b.style.width = width; return b})(),
    (()=>{
      let b = element('button', 'ui compact button ' + color, '+'); b.incdir = +1;
      on(b, 'mousedown', (e)=>{ clearInterval(inteId); on_click(e); inteId = setInterval(on_click, 100, e) });
      on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
      on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
      return b
    })()
  )
}

function checkButton (name, func, color, width, disabled)
{
  return append(
    (()=>{let b = element('span', 'ui mini compact'); b.style.margin = '1px'; return b})(),
    append(
      (()=>{let b = element('label', 'ui ' + color + ' label', name); b.disabled = true; b.style.width = width; return b})(),
      (()=>{
        let b = element('input');
        on(b, 'change', (e)=>{ let t = eTargetT(e); t.glyph.dis = 1 - t.glyph.dis; $(t).fadeTo('fast', 1 - 0.9 * t.glyph.dis); return false});
        b.type = 'checkbox';
        if (disabled) b.checked = 'checked';
        return b}
      )()
    )
  )
}

function makeGlyphTable(g)
{
  const utf8_pfx = g.ft.utf8_pfx
  const code = g.code

  var table, divp
  return append(
    (()=>{ let b = element('div'); b.style.width = 'auto'; return table=b})(),
    (()=>{
      let b = element('h2', 'ui top attached segment', ucharvalue(utf8_pfx, code));
      with (b.style) { fontSize = '2em'; padding = '0.3em'; textAlign = 'center'; }
      return b
    })(),
    (()=>{
      let b = element('div', 'ui attached segment secondary', unicodevalue(utf8_pfx, code) + ' / ' + utf8value(utf8_pfx, code));
      b.style.textAlign = 'center';
      return b
    })(),
    append(
      (()=>{ let b = element('div', 'ui attached segment grid'); b.style.flexWrap = 'nowrap'; return b })(),
      append(
        (()=>{ let b = element('div', 'ui fourteen wide column'); b.style.minWidth = '250px'; return b })(),    // 1/th is 6.25%
        (()=>{
          let t = element('div', 'table glyph')
          t.style.position = 'relative'
          t.style.width = 'max-content' // compact
          t.style.opacity = g.dis ? 0.1 : 1
          t.showGrid = 0
          t.undo = []
          t.undoidx = 0
          t.glyph = g
          return table.t = t
        })()
      ),
      append(
        (()=>{ let b = element('div', 'ui column'); b.style.backgroundColor='#fffaf3'; b.style.width = 'auto'; return b })(),
        append(
          (()=>{ let b = element('div'); b.style.height='97%'; return divp = b })(),
          append(
            (()=>{ let b = element('span', ''); b.style.display = 'flex'; return b })(),
            (()=>{ let b = element('input', ''); b.style.marginRight = '5px'; b.type = 'checkbox'; on(b, 'click', attachPalette); return b })(),
            (()=>{ let b = element('button', 'pico-btn', '+'); on(b, 'click', incDensity); b.disabled = true; return b })(),
            (()=>{ let b = element('button', 'pico-btn', '\u2010'); on(b, 'click', decDensity); b.disabled = true; return b })(),
            (()=>{ let b = element('button', 'pico-btn', '?'); on(b, 'click', showGlyphInfo); return b })()
          ),
          (()=>{ let b = element('div', 'palette'); b.style.display = 'flex'; b.style.marginTop = '10px'; return divp.div = b })()
        ),
        append(
          (()=>{ let b = element('span', ''); b.style.display = 'flex'; return b })(),
          (()=>{ let b = element('button', 'pico-btn', '\u25a1'); b.style.marginRight='10px'; on(b, 'click', showGrid); return b })(),
          (()=>{
            let b = element('button', 'pico-btn', '<'); b.disabled=true;
            on(b, 'mousedown', (e)=>{ clearInterval(inteId); inteId = setInterval(undo, 50, e) });
            on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
            on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
            return table.t.undoBtn=b
          })(),
          (()=>{
            let b = element('button', 'pico-btn', '>'); b.disabled=true;
            on(b, 'mousedown', (e)=>{ clearInterval(inteId); inteId = setInterval(redo, 50, e) });
            on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
            on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
            return table.t.redoBtn=b
          })()
        )
      )
    ),
    append(
      (()=>{ let b = element('div', 'ui bottom attached warning message'); b.style.display = 'flex'; b.style.textAlign = 'center'; return b })(),
      append(
        element('div'),
        upDownButton('Rows', (e)=>{ actv(eTargetT(e), 'rows', e.target.incdir); return false}, 'purple', 50),
        upDownButton('Base', (e)=>{ actv(eTargetT(e), 'base', e.target.incdir); return false}, 'green', 50),
        checkButton('Disable', 'dis', 'yellow', 110, g.dis)
      ),
      append(
        (()=>{ let b = element('div'); b.style.marginLeft = '20px'; return b })(),
        upDownButton('Cols', (e)=>{ actv(eTargetT(e), 'cols', e.target.incdir); return false}, 'purple', 50),
        upDownButton('XAdv', (e)=>{ actv(eTargetT(e), 'xadv', e.target.incdir); return false}, 'orange', 50),
        upDownButton('XOff', (e)=>{ actv(eTargetT(e), 'xoff', e.target.incdir); return false}, 'green', 50)
      )
    )
  )
}

function advanceLoading (percent)
{
  const element = document.querySelector('#loader .advance')
  element.style.width = Math.floor(294 * percent)
}

function displayGlyphTable(ft)
{
  const l = ft.glyphs.length
  for (let i = 0; i < ft.glyphs.length; ++i) {

    let glyph = ft.glyphs[i]
    let adv = (i + 1) / l

    setTimeout(
      ()=>{
        advanceLoading(0.2 + 0.8 * adv)
        const div = makeGlyphTable(glyph)
        rebuildGlyphTable(div.t)
        append(ft.div, div)
        if (adv === 1) {
          $('#loader').hide()
        }
      },
      1
    )
  }
}

function getGlyphsTable(ft)
{
  if (!ft.div) {
    ft.div = element('div', 'ui glyph-grid')
    advanceLoading(0)
    $('#loader').fadeIn(function() {
      displayGlyphTable(ft)
    })
  }
  return ft.div
}

function do_select_fract()
{
  let sect = window.sections
  let opt = sect.selectedOptions[0]
  window.arena.innerHTML = null
  if (opt.ft) {
    append(window.arena, getGlyphsTable(opt.ft))
  }
}

function add_font_sect(ft)
{
  if (!window.sections.options.length) {
    window.sections.innerHTML = '<option>select section</option>'
  }
  const opt = element('option', '', font_name + '_' + ft.fract)
  opt.ft = ft
  window.sections.options.add(opt)
}

function load_err(msg)
{
  alert('No correct font file found (' + msg + ')')
  $("#loader").hide()
}

function tglyph(ft, code, bpp, ver, w, h, xadv, xo, yo, tb, disabled)
{
  return {
    ft: ft,
    tb: tb ? tb : [new Uint8Array(w)],
    bpp: bpp,
    ver: ver,
    w: w,
    h: h,
    code: code,
    xadv: xadv,
    xo: xo,
    yo: yo,
    dis: disabled
  }
}

function extractSection(found1, data)
{
  font_name = found1[1]
  const ft = {}
  var t1
  {
    const re12 = /(\w+)\_(\d+)pt/
    const f12 = found1[1].match(re12)
    font_size = f12 ? f12[2] : '1'
    ft.fract = found1[2]

    let i = found1.index + found1[0].length
    let j = data.indexOf('0};', i)
    let tx = data.substring(i, j+1)
    t1 = eval('[' + tx + ']')
  }

  const font_name_fract = font_name + '_' + ft.fract
  var t2
  {
    const re2 = new RegExp('static\\s+const\\s+GFXfont\\s' + font_name_fract + '\\s*\\{')
    const found2 = re2.exec(data)
    if (found2) {
      let i = found2.index + found2[0].length
      let j = data.indexOf('};', i)
      let tx = data.substring(i, j)
      const s = font_name + '_Glyphs_' + ft.fract
      tx = tx.replace(s, '0')
      t2 = eval( '[' + tx + ']')
    }
    else {
      load_err('No ending section: \'static const GFXfont ' + font_name_fract + ' {\' found')
      return;
    }
  }

  let tg = []
  {
    let i = 0;
    while (i + 10 < t1.length) {
      let n = t1[i+8] + (t1[i+9] << 8)
      let j = i + 10 + n
      tg.push(t1.slice(i, j))
      i = j
    }
  }

  let first = 0
  let last = 0;
  {
    let c1 = t2[1]
    let c2 = t2[2]
    ft.utf8_pfx = (c1 != 0 ? toHex00(c1) + (c2 != 0 ? toHex00(c2) : '') : '').toUpperCase();
    first = t2[4]
    last = t2[5]
    let fract3 = ft.utf8_pfx != '' ? ft.utf8_pfx : toHex00(first)
    if (fract3 != ft.fract) {
      load_err('Font subranges in footer not match: ' + ft.fract + ' <> ' + fract3)
      return;
    }
    ft.height = t2[6]
  }

  ft.first = first
  ft.last = last

  // Run pre-calculations for correct display
  let maxW = 0
  ft.maxBaseline = 0
  ft.minUnderBaseline = 0
  for (let g of tg) {
    const inv_oh = signedByte(g[7])
    maxW = Math.max(maxW, g[3], g[5])
    ft.maxBaseline = Math.max(ft.maxBaseline, inv_oh)
    ft.minUnderBaseline = Math.min(ft.minUnderBaseline, inv_oh + 1 - g[4])
  }

  ft.glyphs = []
  let lastChar = ft.first
  for (let g of tg) {
    const code = g[0]
    while (code > lastChar) {
      ft.glyphs.push(tglyph(ft, lastChar, 0, 0, 1, 1, 4, 0, -ft.height, null,true))
      ++lastChar
    }
    const bpp = g[1]
    const ver = g[2]
    const w = g[3]
    const h = g[4]
    const xadv = g[5]
    const xo = signedByte(g[6])
    const yo = -signedByte(g[7])
    const nof = g[8] | (g[9] << 8);
    const tb = font_tabXY(bpp, ver, w, h, g.slice(10, g.length))
    ft.glyphs.push(tglyph(ft, code, bpp, ver, w, h, xadv, xo, yo, tb, false))
    ++lastChar
  }
  while (lastChar <= last) {
    ft.glyphs.push(tglyph(ft, lastChar, 0, 0, 1, 1, 4, 0, -ft.height, null,true))
    ++lastChar
  }
  return ft
}

function do_import()
{
  let data = $('#source').val()
  const reGlyphs = /static\s+const\s+uint8\_t\s+(\w+)\_Glyphs\_(\w+)\[\]\s*\{/g
  var fx
  let reset = true
  while (fx = reGlyphs.exec(data) ) {
    const ft = extractSection(fx, data)
    if (reset) {
      window.sections.innerHTML = null
      reset = false
    }
    add_font_sect(ft)
  }
  if (reset) {
    load_err(data.substring(0, 100))
  }
  else {
    showFontName()
  }
}

function createGlyphs()
{
  const name = val(d_create.name)
  if (name.length < 1) {
    do_msg('The font must have a name.')
    return
  }

  const fontSize = ival(d_create.size)
  if (fontSize < 1) {
    do_msg('The font size must be greater than 0.')
    return
  }

  const fontHeight = ival(d_create.height)
  if (fontHeight < 1) {
    do_msg('The font height must be greater than 0.')
    return
  }

  const l_utf8_pfx = val(d_create.utf8_pfx).replace(/\s/g, '').toUpperCase()
  const first = parseInt(val(d_create.first_hex), 16)
  const last = parseInt(val(d_create.last_hex), 16)

  const fst_utf8_tt = utf8table(l_utf8_pfx, first)

  if (fst_utf8_tt == '' || fst_utf8_tt.length == 0) {
    do_msg('First character is incorrect.')
    return
  }
  const l_idx = fst_utf8_tt.length - 1;

  const lst_utf8_tt = utf8table(l_utf8_pfx, last)

  if (lst_utf8_tt == '' || lst_utf8_tt.length != l_idx + 1) {
    do_msg('Last character is incorrect.')
    return
  }

  for (i = 0; i <= l_idx; ++i) {
    if (parseInt(fst_utf8_tt[i], 16) > parseInt(lst_utf8_tt[i], 16)) {
      do_msg('Last char can\'t be less then the first one')
      return;
    }
  }

  const ft = {}
  font_name = name + '_' + fontSize + 'pt'
  font_size = fontSize
  ft.utf8_pfx = l_utf8_pfx
  ft.fract = (l_utf8_pfx.length > 0 ? l_utf8_pfx : toHex00(first)).toUpperCase()
  ft.height = fontHeight
  ft.minUnderBaseline = -Math.round(fontHeight/5)
  ft.maxBaseline = fontHeight + ft.minUnderBaseline;
  ft.first = first
  ft.last = last

  ft.glyphs = []
  for (j = first; j <= last; ++j) {
    const code = j
    ft.glyphs.push(tglyph(ft, code, 0, 0, 1, 1, 4, 0, -ft.maxBaseline, null ,false))
  }

  add_font_sect(ft)

  showFontName()
}

function do_msg(msg)
{
  if (!d_msg.div)
  d_msg.div = append(
    append(
      element('div',"ui small modal message"),
      element('div', "header", "⚠️ Warning"),
      append(
        element('div',"content"),
        (()=>{ let d = element('p'); return d_msg.p=d })()
      ),
      append(
        element('div', "actions"),
        element('div', "ui approve blue button", "Ok")
      )
    )
  );

  setval(d_msg.p, msg)
  $(d_msg.div).modal('show')
}

function do_reset()
{
  if (!d_conf.div)
  d_conf.div = append(
    element('div', "ui small modal confirmation"),
    element('div', "header", "⚠️ Warning"),
    append(
      element('div',"content"),
      (()=>{ let d = element('p'); return d_conf.p=d })()
    ),
    append(
      element('div', "actions"),
      element('div', "ui cancel blue button", "Cancel"),
      element('div', "ui approve red button", "Reset")
    )
  );

  setval(d_conf.p, 'The reset will close the font and discard any changes you made.')
  $(d_conf.div).modal({
    closable: false,
    onApprove: function() {
      $('#source').val('')
      showFontName('hide')
      window.sections.innerHTML = null
    }
  }).modal('show')
}

function do_create()
{
  if (!d_create.div)
  d_create.div = append(
    element('div', "ui small modal"),
    element('div', "header", "Create a new font set"),
    append(
      element('div', "content"),
      append(
        element('div', "ui right labeled input"),
        element('a', "ui label", "Font name"),
        (()=>{ let d = element('input'); d.type="text"; d.placeholder="Name of the new font"; return d_create.name=d})()
      ),
      element('p', '', "Font height in pixels for all characters."),
      append(
        element('div', "ui right labeled input"),
        element('a', "ui label", "Font size"),
        (()=>{ let d = element('input'); d.style.width="150px"; d.type="number"; d.min=1; d.placeholder="in pt e.g. 12";
          on(d, 'keyup', function(){ setval(d_create.height, Math.round(ival(this)/0.41)) });
          on(d, 'change', function(){ setval(d_create.height, Math.round(ival(this)/0.41)) });
          return d_create.size=d
        })(),
        element('a', "ui label", "Font height"),
        (()=>{ let d = element('input'); d.style.width="150px"; d.type="number"; d.min=1; d.placeholder="in pixels e.g. 28"; return d_create.height=d})()
      ),
      element('p', '', "UTF-8 (hex coded) starting characters e.g.: C4 - for latin A, E5 AD - for some CJKs."),
      append(
        element('div',"ui right labeled input"),
        element('a', "ui label", "UTF-8 prefix"),
        (()=>{ let d = element('input'); d.type="text"; d.placeholder="for ASCII leave it empty"; d.maxlength=5;
          on(d, 'keyup', function (e) { newCharsChanged(this, d_create.first_hex, d_create.last_hex) });
          on(d, 'change', function (e) { newCharsChanged(this, d_create.first_hex, d_create.last_hex) });
          return d_create.utf8_pfx=d
        })()
      ),
      element('br'),
      element('p', '', "2 hex char code, for UTF-8: last sequence - valid are 80 to BF."),
      append(
        element('div', "ui right labeled input"),
        element('a', "ui label", "First char code"),
        (()=>{ let d = element('input'); d.style.width="80px"; d.type="text"; d.placeholder="e.g. 40"; d.maxlength=2;
          on(d, 'keyup', function (e) { newCharsChanged(d_create.utf8_pfx, this, d_create.last_hex) });
          on(d, 'change', function (e) { newCharsChanged(d_create.utf8_pfx, this, d_create.last_hex) });
          return d_create.first_hex=d})(),
        (()=>{ let d = element('input'); d.style.width="60px"; d.readonly=true; d.type="text"; d.id="code"; return d})(),
        (()=>{ let d = element('input'); d.style.width="100px"; d.readonly=true; d.type="text"; d.id="ucode"; return d})(),
        (()=>{ let d = element('input'); d.style.width="150px"; d.readonly=true; d.type="text"; d.id="utf8"; return d})()
      ),
      append(
        element('div', "ui right labeled input"),
        element('a', "ui label", "Last char code"),
        (()=>{ let d = element('input'); d.style.width="80px"; d.type="text"; d.placeholder="e.g. 5F"; d.maxlength=2;
          on(d, 'keyup', function (e) { newCharsChanged(d_create.utf8_pfx, d_create.first_hex, this) });
          on(d, 'change', function (e) { newCharsChanged(d_create.utf8_pfx, d_create.first_hex, this) });
          return d_create.last_hex=d
        })(),
        (()=>{ let d = element('input'); d.style.width="60px"; d.readonly=true; d.type="text"; d.id="code"; return d})(),
        (()=>{ let d = element('input'); d.style.width="100px"; d.readonly=true; d.type="text"; d.id="ucode"; return d})(),
        (()=>{ let d = element('input'); d.style.width="150px"; d.readonly=true; d.type="text"; d.id="utf8"; return d})()
      )
    ),
    append(
      element('div', "actions"),
      element('div', "ui cancel red button", "Cancel"),
      element('div', "ui approve green button", "Create")
    )
  );

  let fname = ''
  if (!font_name) {
    fname = 'Default'
  }
  else {
    const re12 = /(\w+)\_(\d+)pt/
    const f12 = font_name.match(re12)
    if (f12) {
      fname = f12[1]
    }
    else {
      fname = font_name
    }
  }
  setval(d_create.name, fname)

  if (!font_size) {
    font_size = 12
  }
  setval(d_create.size, font_size)

  let height = 28
  let utf8_pfx = ''
  let first = 0x20
  let last = 0x3f

  let opt = window.sections.lastChild
  if (opt) {
    let ft = opt.ft
    height = ft.height
    utf8_pfx = ft.utf8_pfx
    if (!utf8_pfx) {
      first = ft.last + 1
      last = first + 0x1F
    }
    else {
      utf8_pfx = ''
      first = 0
      last = 0
    }
  }

  setval(d_create.height, height)
  setval(d_create.utf8_pfx, utf8_pfx)
  setval(d_create.first_hex, toHex00(first))
  setval(d_create.last_hex, toHex00(last))

  $(d_create.div).modal({
    closable: false,
    onApprove: createGlyphs
  }).modal('show')
}

function do_export()
{
  const newver = $('#datacompr')[0].value
  const res = []
  const fracts = []
  for (let opt of window.sections.options) {
    if (!opt.ft) {
      continue
    }
    const ft = opt.ft
    const tg = []
    for (let t of opt.ft.glyphs) {
      if (!t.dis) {
        const ver = newver ? parseInt(newver) : t.ver
        const bitmap = tabXY_font(t.bpp, ver, t.w, t.h, t.tb)
        tg.push(tsd_glyph(ft.utf8_pfx, t.code, t.bpp, ver, t.w, t.h, t.xadv, t.xo, -t.yo, bitmap))
      }
    }
    res.push(tsd_fract(font_name, ft.fract, ft.utf8_pfx, ft.first, ft.last, ft.height, tg.join('\n')))
    fracts.push(ft.fract)
  }
  res.push(tsd_font(font_name, fracts))
  $('#result').val(res.join('\n') + '\n')
}

function showFontName()
{
  let d = $('.fontname')
  let p = d.parent().parent().parent()
  if (arguments.length) {
    window.font_name = undefined
    window.font_size = undefined
    d.text('undefined')
    document.getElementById('tsdfname').textContent = null
    $('#result').val(null)
    p.hide()
    window.arena.innerHTML = '<em>Please import or create a font set first.</em>'
  }
  else {
    d.text(font_name)
    document.getElementById('tsdfname').textContent = 'TSD_' + font_name + '.h'
    p.show()
    window.arena.innerHTML = '<em>Please select fonts fraction.</em>'
  }
}

function clr_input_file()
{
  $('#load-file').val(null)
  $('#source').val(null)
}

function saveFile()
{
  const link = document.createElement("a")
  const file = new Blob([$('#result').val()], { type: 'text/plain' })
  link.href = URL.createObjectURL(file)
  link.download = document.getElementById('tsdfname').textContent
  link.click()
  URL.revokeObjectURL(link.href)
}

function on_load()
{
  window.font_name = undefined
  window.font_size = undefined
  window.sections = $('#sections')[0]
  window.arena = $('#arena')[0]
  showFontName('hide')
  window.d_create = {}
  window.d_msg = {}
  window.d_conf = {}
  window.d_palette = {}

  $('#loader').hide()

  $('#load-file').change(
    function() {
      with (new FileReader()) {
        onload = function() { $('#source').val(this.result) }
        readAsText(this.files[0])
      }
    }
  )
}
