/*
  Font-Customizer 3.1

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

function resizePixels (t)
{
  const pixels = t.tb

  let w = t.w
  let h = t.h

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

function eTargetGlyph(e)
{
  e = e.target
  while (e) {
    if (e.hasOwnProperty('tb')) {
      return e;
    }
    if (e.hasOwnProperty('glyph')) {
      return e.glyph;
    }
    e = e.parentElement
  }
}

function getPixelColor(t, cell)
{
  const x = cell.x - t.xo;
  const y = cell.y - (ftdt.maxBaseline + t.yo)
  const pixels = t.tb

  if (y >= 0 && y < pixels.length) {
    const pxrow = pixels[y]
    if (x >= 0 && x < pxrow.length) {
      return pxrow[x]
    }
  }
  return 0
}

function setBackground(cell, v)
{
  let c = 255 - v
  let cc = c < 232 ? c + 24 : 255
  cell.style.backgroundColor = 'rgb(' + c + ',' + cc + ',' + c + ')'
}

function setPixelColor(t, cell, fill)
{
  const x = cell.x - t.xo;
  const y = cell.y - (ftdt.maxBaseline + t.yo)
  const pixels = t.tb

  if (y >= 0 && y < pixels.length) {
    const pxrow = pixels[y]
    if (x >= 0 && x < pxrow.length) {
      const prev = pxrow[x]
      removeClass(cell, 'dead')
      addClass(cell, 'fill')
      if (!(fill === undefined || fill === false)) pxrow[x] = fill
      setBackground(cell, pxrow[x])
      if (cell.x >= t.xadv || cell.x < Math.max(0, t.xo)) {
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
    const t = eTargetGlyph(e)
    if (d_palette.fill && d_palette.div.table == t) {
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
  switch (act) {
    case 'rows':
      t.h += v
      if (t.h < 1) {
        t.h = 1
        return
      }
      resizePixels(t)
      return true
    case 'cols':
      t.w += v
      if (t.w < 1) {
        t.w = 1
        return
      }
      resizePixels(t)
      return true
    case 'base':
      t.yo += v
      rebuildGlyphTable(t)
      return true
    case 'xoff':
      t.xo += v
      rebuildGlyphTable(t)
      return true
    case 'xadv':
      t.xadv += v
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
  const t = eTargetGlyph(e)
  if (t.undoidx > 0) {
    const u = t.undo[--t.undoidx]
    act_(t, u[0], u[1], u[3], u[4])
    t.undoBtn.disabled = t.undoidx <= 0
    t.redoBtn.disabled = false
  }
}

function redo(e)
{
  const t = eTargetGlyph(e)
  if (t.undoidx < t.undo.length) {
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
  setBackground(e.target.parentElement.parentElement.previousSibling.firstChild, e.target.fill, t.bpp)  // for seeing only
}

function makePalette(bpp)
{
  if (bpp == 0) { h = 2; w = 1; m = 255 } else
  if (bpp == 1) { h = 4; w = 1; m = 85 } else
  if (bpp == 2) { h = 16; w = 1; m = 17 } else
                { h = 16; w = 16; m = 1 }
  const p = element('div');
  p.style.width = 'max-content' // compact
  p.style.position = 'relative'
  for (let j = h; --j >= 0; ) {
    const row = element('div', 'row')
    for (let i = w; --i >= 0; ) {
      let cell = element('div', 'cell')
      on(cell, 'click', setupPaletteFill)
      cell.fill = (j * w + i) * m
      setBackground(cell, cell.fill)
      append(row, cell)
    }
    append(p, row)
  }
  return p
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
  const t = eTargetGlyph(e)
  if (!d_palette.div || d_palette.div.table.bpp != t.bpp) {
    d_palette.div = makePalette(t.bpp)
  }
  detachPalette(e.target)
  appendPalette(e.target)
  d_palette.div.table = t
  e.target.nextSibling.disabled = !e.target.checked
  e.target.nextSibling.nextSibling.disabled = !e.target.checked
}

function changeDensity(t, input, v)
{
  v = t.bpp + v
  if (v < 0 || v > 3) {
    return
  }
  if (input.checked) {
    detachPalette(input)
    t.bpp = v
    d_palette.div = makePalette(t.bpp)
    appendPalette(input)
    d_palette.div.table = t
  }
}

function incDensity(e)
{
  changeDensity(eTargetGlyph(e), e.target.previousSibling, +1)
}

function decDensity(e)
{
  changeDensity(eTargetGlyph(e), e.target.previousSibling.previousSibling, -1)
}

function showGrid(e)
{
  const t = eTargetGlyph(e)
  t.showGrid = 1 - t.showGrid
  rebuildGlyphTable(t)
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
  return append(
    (()=>{ let d = element('table'); d.style.width = '100%'; d.style.fontSize = '0.8rem';  return d })(),
    tr4td('Rows', t.h, 'Cols', t.w),
    tr4td('Base',  t.yo, 'XAddv', t.xadv),
    tr4td('MaxBase', ftdt.maxBaseline, 'XOff', t.xo),
    tr4td('Baseline', ftdt.minUnderBaseline, 'Height', ftdt.font_height),
  )
}

function showGlyphInfo(e)
{
  const t = eTargetGlyph(e)
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

function rebuildGlyphTable (t)
{
  if (t.info) {
    t.info.innerHTML= null
    append(t.info, glyph_info(t))
  }

  t.innerHTML = null
  const jmax = ftdt.maxBaseline + 1 - ftdt.minUnderBaseline
  const imin = Math.min(0, t.xo)
  const imax = Math.max(t.xadv, t.w + t.xo)
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
      on(cell, 'mousedown', (e)=>{ isFilling = true; fill_cell(e) })
      on(cell, 'mouseup', (e)=>{ isFilling = false })
      on(cell, 'mouseenter', (e)=>{ if (isFilling) fill_cell(e) })
      cell.x = i
      cell.y = j
      if (i === 0 && j === 0) {
        t.before_xoffset = cell
      }
      if (j === 0 && i === t.xadv) {
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
    (()=>{ let b = element('div', 'baseline'); b.style.top = (ftdt.maxBaseline + 1) * 10 - 1; return b})()
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
        on(b, 'change', (e)=>{ let t = eTargetGlyph(e); t.dis = 1 - t.dis; $(t).fadeTo('fast', 1 - 0.9 * t.dis); return false});
        b.type = 'checkbox';
        if (disabled) b.checked = 'checked';
        return b}
      )()
    )
  )
}

function makeGlyphItem (code, bpp, w, h, xadv, xo, yo, tb, disabled)
{
  var table, divp
  return append(
    (()=>{ let b = element('div'); b.style.width = 'auto'; return table=b})(),
    (()=>{
      let b = element('h2', 'ui top attached segment', ucharvalue(ftdt.utf8_pfx, code));
      with (b.style) { fontSize = '2em'; padding = '0.3em'; textAlign = 'center'; }
      return b
    })(),
    (()=>{
      let b = element('div', 'ui attached segment secondary', unicodevalue(ftdt.utf8_pfx, code) + ' / ' + utf8value(ftdt.utf8_pfx, code));
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
          t.style.opacity = disabled ? 0.1 : 1
          t.tb = tb ? tb : [new Uint8Array(w)]
          t.bpp = bpp
          t.w = w
          t.h = h
          t.code = code
          t.xadv = xadv
          t.xo = xo
          t.yo = yo
          t.dis = disabled
          t.showGrid = 0
          t.undo = []
          t.undoidx = 0
          return table.glyph = t
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
            on(b, 'mousedown', (e)=>{ clearInterval(inteId); undo(e); inteId = setInterval(undo, 50, e) });
            on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
            on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
            return table.glyph.undoBtn=b
          })(),
          (()=>{
            let b = element('button', 'pico-btn', '>'); b.disabled=true;
            on(b, 'mousedown', (e)=>{ clearInterval(inteId); redo(e); inteId = setInterval(redo, 50, e) });
            on(b, 'mouseup', (e)=>{ clearInterval(inteId) });
            on(b, 'mouseleave', (e)=>{ clearInterval(inteId) });
            return table.glyph.redoBtn=b
          })()
        )
      )
    ),
    append(
      (()=>{ let b = element('div', 'ui bottom attached warning message'); b.style.display = 'flex'; b.style.textAlign = 'center'; return b })(),
      append(
        element('div'),
        upDownButton('Rows', (e)=>{ actv(eTargetGlyph(e), 'rows', e.target.incdir); return false}, 'purple', 50),
        upDownButton('Base', (e)=>{ actv(eTargetGlyph(e), 'base', e.target.incdir); return false}, 'green', 50),
        checkButton('Disable', 'dis', 'yellow', 110, disabled)
      ),
      append(
        (()=>{ let b = element('div'); b.style.marginLeft = '20px'; return b })(),
        upDownButton('Cols', (e)=>{ actv(eTargetGlyph(e), 'cols', e.target.incdir); return false}, 'purple', 50),
        upDownButton('XAdv', (e)=>{ actv(eTargetGlyph(e), 'xadv', e.target.incdir); return false}, 'orange', 50),
        upDownButton('XOff', (e)=>{ actv(eTargetGlyph(e), 'xoff', e.target.incdir); return false}, 'green', 50)
      )
    )
  )
}

function advanceLoading (percent)
{
  const element = document.querySelector('#loader .advance')
  element.style.width = Math.floor(294 * percent)
}

function displayGlyphTable ()
{
  let glyphs = window.glyphs
  const l = glyphs.children.length
  for (let i = 0; i < glyphs.children.length; ++i) {

    let el = glyphs.children[i]
    let adv = (i + 1) / l

    setTimeout(
      ()=>{
        advanceLoading(0.2 + 0.8 * adv)
        rebuildGlyphTable(el.glyph)
        if (adv === 1) {
          $('#loader').hide()
        }
      },
      1
    )
  }
}

function load_err(msg)
{
  alert('No correct font file found (' + msg + '), please paste the suitable fragment of TSD_GFX font file first.')
  $("#loader").hide()
}

function extractFonts()
{
  let data = $('#source').val()

  const re1 = /static\s+const\s+uint8\_t\s+(\w+)\_Glyphs\_(\w+)\[\]\s*\{/
  const re12 = /(\w+)\_(\d+)pt/
  const found1 = data.match(re1)

  window.ftdt = {}
  var t1
  if (found1 != null && found1.length > 2) {
    ftdt.font_name = found1[1]
    const f12 = found1[1].match(re12)
    ftdt.font_size = f12 ? f12[2] : '1'
    ftdt.font_fract = found1[2]

    let i = data.indexOf(found1[0]) + found1[0].length
    let j = data.indexOf('0};', i)
    t1 = eval('[' + data.substring(i, j+1) + ']')
  } else {
      load_err('No starting section: \'static const uint8_t <FontName>_<size>pt_Glyphs_<CC>[]\' found')
    return
  }

  var t2
  {
    const re2 = /static\s+const\s+GFXfont\s+(\w+)\_(\w+)\s*\{/
    const found2 = data.match(re2)
    if (found2 != null && found2.length > 2) {

      let name2 = found2[1]
      if (ftdt.font_name != name2) {
        load_err('Font names not match: ' + ftdt.font_name + ' <> ' + name2)
        return;
      }
      let fract2 = found2[2]
      if (ftdt.font_fract != fract2) {
        load_err('Font subranges not match: ' + ftdt.font_fract + ' <> ' + fract2)
        return;
      }
      let i = data.indexOf(found2[0]) + found2[0].length
      i = data.indexOf(',', i) + 1
      let j = data.indexOf('};', i)
      t2 = eval( '[' + data.substring(i, j) + ']')
    }
    else {
      load_err('No ending section: \'static const GFXfont <FontName>_<size>pt_<CC>\' found')
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
    let c1 = t2[0]
    let c2 = t2[1]
    ftdt.utf8_pfx = (c1 != 0 ? toHex00(c1) + (c2 != 0 ? toHex00(c2) : '') : '').toUpperCase();
    first = t2[3]
    last = t2[4]
    let fract3 = ftdt.utf8_pfx != '' ? ftdt.utf8_pfx : toHex00(first)
    if (fract3 != ftdt.font_fract) {
      load_err('Font subranges in footer not match: ' + ftdt.font_fract + ' <> ' + fract3)
      return;
    }
    ftdt.font_height = t2[5]
  }

  ftdt.first_glyph = first
  ftdt.last_glyph = last

  window.glyphs.innerHTML = null
  $('.fontname').text(ftdt.font_name).parent().show()

  // Run pre-calculations for correct display
  let maxW = 0
  ftdt.maxBaseline = 0
  ftdt.minUnderBaseline = 0
  for (let g of tg) {
    const inv_oh = signedByte(g[7])
    maxW = Math.max(maxW, g[3], g[5])
    ftdt.maxBaseline = Math.max(ftdt.maxBaseline, inv_oh)
    ftdt.minUnderBaseline = Math.min(ftdt.minUnderBaseline, inv_oh + 1 - g[4])
  }

  // sort glyphsArray

  let datacompr = 1
  let lastChar = first
  for (let g of tg) {
    const code = g[0]
    while (code > lastChar) {
      const grid = makeGlyphItem(lastChar, 0, 1, 1, 4, 0, -ftdt.font_height, null,true)
      append(window.glyphs, grid)
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
    if (ver) {
      datacompr = 0
    }
    const grid = makeGlyphItem(code, bpp, w, h, xadv, xo, yo, tb, false)
    append(window.glyphs, grid)
    ++lastChar
  }
  while (lastChar <= last) {
    const grid = makeGlyphItem(lastChar, 0, 1, 1, 4, 0, -ftdt.font_height, null,true)
    append(window.glyphs, grid)
    ++lastChar
  }
  displayGlyphTable()

  $('#firstglyph').val(toHex(ftdt.first_glyph))
  $('#lastglyph').val(toHex(ftdt.last_glyph))
  $('#datacompr')[0].checked = datacompr

  $('#export').prop( "disabled", false )
  $('#reset').prop("disabled", false)
  $('#create').prop( "disabled", true )
  $('#extract').prop( "disabled", true )
}

function createFonts()
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

  window.ftdt = {}
  ftdt.font_name = name + '_' + fontSize + 'pt'
  ftdt.font_size = fontSize
  ftdt.utf8_pfx = l_utf8_pfx
  ftdt.font_fract = (l_utf8_pfx.length > 0 ? l_utf8_pfx : toHex00(first)).toUpperCase()
  ftdt.font_height = fontHeight
  ftdt.minUnderBaseline = -Math.round(fontHeight/5)
  ftdt.maxBaseline = fontHeight + ftdt.minUnderBaseline;
  ftdt.first_glyph = first
  ftdt.last_glyph = last

  $('.fontname').text(ftdt.font_name).parent().show()
  $('#firstglyph').val(toHex(ftdt.first_glyph))
  $('#lastglyph').val(toHex(ftdt.last_glyph))
  $('#datacompr')[0].checked = 1
  window.glyphs.innerHTML = null

  // Change button states
  $('#export').prop( "disabled", false )
  $('#create').prop( "disabled", true )
  $('#import').prop( "disabled", true )
  $('#reset').prop("disabled", false)

  for (j = first; j <= last; ++j) {
    const code = j
    const grid = makeGlyphItem(code, 0, 1, 1, 4, 0, -ftdt.maxBaseline, null ,false)
    append(window.glyphs, grid)
    rebuildGlyphTable(grid.glyph)
  }
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
      window.glyphs.innerHTML = null
      $('#source').val('')
      $('#create').prop("disabled", false)
      $('#import').prop("disabled", false)
      $('#export').prop("disabled", "disabled")
      $('#reset').prop("disabled", "disabled")
      $('.fontname').text('unknown').parent().hide()
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
        (()=>{ let d = element('input'); d.type="text"; d.value="Default"; d.placeholder="Name of the new font"; return d_create.name=d})()
      ),
      element('p', '', "Font height in pixels for all characters."),
      append(
        element('div', "ui right labeled input"),
        element('a', "ui label", "Font size"),
        (()=>{ let d = element('input'); d.style.width="150px"; d.type="number"; d.min=1; d.value="12"; d.placeholder="in pt e.g. 12";
          on(d, 'keyup', function(){ setval(d_create.height, Math.round(ival(this)/0.41)) });
          on(d, 'change', function(){ setval(d_create.height, Math.round(ival(this)/0.41)) });
          return d_create.size=d
        })(),
        element('a', "ui label", "Font height"),
        (()=>{ let d = element('input'); d.style.width="150px"; d.type="number"; d.min=1; d.value="28"; d.placeholder="in pixels e.g. 28"; return d_create.height=d})()
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
        (()=>{ let d = element('input'); d.style.width="80px"; d.type="text"; d.value="40"; d.placeholder="e.g. 40"; d.maxlength=2;
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
        (()=>{ let d = element('input'); d.style.width="80px"; d.type="text"; d.value="5F"; d.placeholder="e.g. 5F"; d.maxlength=2;
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

  $(d_create.div).modal({
    closable: false,
    onApprove: createFonts
  }).modal('show')
}

function do_import()
{
  advanceLoading(0)
  $('#loader').fadeIn(function() {
    extractFonts()
  })
}

function do_export()
{
  const ver = 1 - $('#datacompr')[0].checked
  const tg = []
  for (let t of glyphs.children) {
    const g = t.glyph
    if (!g.dis) {
      const bitmap = tabXY_font(g.bpp, ver, g.w, g.h, g.tb)
      tg.push(tsd_glyph(ftdt.utf8_pfx, g.code, g.bpp, ver, g.w, g.h, g.xadv, g.xo, -g.yo, bitmap))
    }
  }
  const res = tsd_fract(ftdt.font_name, ftdt.font_fract, ftdt.font_height, ftdt.utf8_pfx, ftdt.first_glyph, ftdt.last_glyph, tg.join('\n'))
  $('#result').val(res)
}

function on_load()
{
  window.glyphs = $('#glyphs')[0]
  window.d_create = {}
  window.d_msg = {}
  window.d_conf = {}
  window.d_palette = {}

  $('#export').attr('disabled', 'disabled')
  $('#reset').prop("disabled", 'disabled')
  $('#loader').hide()
  $('#import').click(do_import)
  $('#reset').click(do_reset)
  $('#create').click(do_create)
  $('#export').click(do_export)
}
