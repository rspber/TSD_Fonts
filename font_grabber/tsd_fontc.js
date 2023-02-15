/*
  tsd_fontc

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

// decompression
function font0_font1(bp0, w, h)
{
  const bp1 = []
  let i = 0
  let b = 0
  let c = 0
  let bits = 0
  let k = 0
  let n = ((w + 7) >> 3) * h
  while (bp1.length < n) {
    if (!b) {
      bits = bp0[k++]
      b = 0x80
    }
    if (i && !(i & 0x07)) {
      bp1.push(c)
      c = 0
    }
    c = (c << 1) | (bits & b ? 1 : 0)
    b >>= 1
    if (++i >= w) {
      if (i & 7) {
        c <<= 8 - (i & 7)
      }
      bp1.push(c)
      c = 0
      i = 0
    }
  }
  return bp1
}

// compression
function font1_font0(bp1, w, h)
{
  const bp0 = []
  let f = 0
  let b = 0
  let d = 0
  let j = 0
  let i = 0
  while (--h >= 0) {
    for (let x = w; --x >= 0; ) {
      if (!b) {
        d = bp1[i++]
        b = 0x80
      }
      f = (f << 1) | ((d & b) ? 1 : 0)
      b >>= 1
      if (++j >= 8) {
        bp0.push(f)
        f = 0
        j = 0
      }
    }
    b = 0
  }
  if (j > 0) {
    f <<= 8 - j
    bp0.push(f)
  }
  return bp0
}
