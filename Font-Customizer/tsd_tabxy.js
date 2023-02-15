/*
  tsd_tabxy

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

function font_tabXY(bpp, ver, w, h, bp)
{
  let tb = []
  var b0, j0, sh, v0
  if (bpp == 0) { b0 = 0x80; j0 = 8; sh = 1 } else
  if (bpp == 1) { b0 = 0xc0; j0 = 4; sh = 2 } else
  if (bpp == 2) { b0 = 0xf0; j0 = 2; sh = 4 } else
                { b0 = 0xff; j0 = 1; sh = 8 }
  let i = 0
  let u = 0
  let j = 1
  while (tb.length < h) {
    if (ver) j = 1; // bp is not compressed
    let r = new Uint8Array(w)
    for (let x = 0; x < w; ++x) {
      if (!--j) {
        u = bp[i++]
        j = j0
      }
      const v = u & b0
      r[x] = v ? v + (0x100 - b0 - 1) : 0
      u <<= sh
    }
    tb.push(r)
  }
  return tb;
}

function tabXY_font(bpp, ver, w, h, tb)
{
  let bp = []
  var j0, shu, shx
  if (bpp == 0) { j0 = 8; shu = 1; shx = 7 } else
  if (bpp == 1) { j0 = 4; shu = 2; shx = 6 } else
  if (bpp == 2) { j0 = 2; shu = 4; shx = 4 } else
                { j0 = 1; shu = 8; shx = 0 }
  let u = 0
  let j = 0
  for (let cells of tb) {
// w == cells.length
    for (let x = 0; x < w; ++x) {
      u = (u << shu) | (cells[x] >> shx)
      if (++j >= j0) {
        bp.push(u)
        u = 0
        j = 0
      }
    }
    if (ver)    // no compress
      if (j) {
        u <<= j0 - j
        bp.push(u)
        u = 0
        j = 0
      }
  }
  if (j) {
    u <<= j0 - j
    bp.push(u)
  }
  return bp
}
