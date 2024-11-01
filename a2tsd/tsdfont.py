#!/usr/bin/python3

#  Copyright (c) 2023, rspber (https://github.com/rspber)
#  All rights reserved

#  tsdfont library

# decompression
def font0_font1(w, h, bp0):
	bp1 = []
	i = 0
	b = 0
	c = 0
	bits = 0;
	k = 0
	n = ((w + 7) >> 3) * h
	while len(bp1) < n:
		if b == 0:
			bits = bp0[k]
			k = k + 1
			b = 0x80
		if i > 0 and (i & 0x07) == 0:
			bp1.append(c)
			c = 0
		c = (c << 1) | int(bits & b > 0)
		b = b >> 1
		i = i + 1
		if i >= w:
			if i & 7:
				c <<= 8 - (i & 7)
			bp1.append(c)
			c = 0
			i = 0
	return bp1

# compression
def font1_font0(w, h, bp1):
	bp0 = []
	i = 0
	b = 0
	j = 0
	d = 0
	while i < len(bp1):
		k = 0
		while k < w:
			if b == 0:
				c = bp1[i]
				i = i + 1
				b = 0x80
			if c & b:
				a = 1
			else:
				a = 0
			b = b >> 1
			d = (d << 1) | a
			j = j + 1
			if j >= 8:
				bp0.append(d)
				d = 0
				j = 0
			k = k + 1
		b = 0
	if j > 0:
		d = d << (8 - j)
		bp0.append(d)
	return bp0

def print_glyph(f, code, ver, w, h, xadv, x0, y0, bitmap):
	xo = x0 & 0xff		# convert to positive
	yo = y0 & 0xff		# convert to positive
	s = ''
	j = 9
	for i in range (len(bitmap)):
		s = s + (' 0x%02X' % bitmap[i]) + ','
		j = j + 1
		if j > 14:
			s = s + '\n   '
			j = 0
	if j == 14:
		s = s + '\n   '
		j = 0
	le = len(bitmap)
	f.write('  0x%02X, 0x00, %d, %d, %d, %d, 0x%02x, 0x%02x, %d, %d,%s // \'%c\'\n' % (code, ver, w, h, xadv, xo, yo, le & 0xff, le >> 8, s, code))

def print_glyphs_header(f, name, code0):
	f.write('static const uint8_t %s_Glyphs_%02X[] {\n' % (name, code0))

def print_glyphs_footer(f, name, code0, code, yadv):
	f.write('0};\n\n')
	f.write('static const TSD_GFXfont %s_%02X {\n  %s_Glyphs_%02X,\n  0x00, 0x00, 0, 0x%02X, 0x%02X, %d\n};\n\n' % (name, code0, name, code0, code0, code-1, yadv))

def print_fonts_list(f, name, tt):
	f.write('static const TSD_GFXfont* %s[] {\n' % name)
	for c0 in tt:
		f.write('  &%s_%02X,\n' % (name, c0))
	f.write('  0\n};\n\n')
