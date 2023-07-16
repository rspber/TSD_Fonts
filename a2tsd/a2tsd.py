#!/usr/bin/python3

#  Copyright (c) 2023, rspber (https://github.com/rspber)
#  All rights reserved
#
# Utility to convert Adafruit's GFX fonts to TSD font format.
#
# Usage:
#  - place Adafruit's fonts in subdirectory Fonts
#  - create empty subdirectory TSDFonts
#  - run a2tsd.py c
#  - or `run a2tsd.py` for not to compress fonts bitmaps
#  - then place the new fonts in tsdesktop/gfx/Fonts directory

import os, sys, re
import tsdfont

# with bitmaps compression
ver = 0

def dump_font_file(f, bitmaps, glyphs, yadv, name):

	global ver

	code = 0x20
	tt = []

	for i in range(len(glyphs)):
		if i & 0x1f == 0:
			if i > 0:
				tsdfont.print_glyphs_footer(f, name, code0, code, yadv)
			tsdfont.print_glyphs_header(f, name, code)
			code0 = code
			tt.append(code0)

		if i + 1 < len(glyphs):
			upto = glyphs[i+1][0]
		else:
			upto = len(bitmaps)
		g = glyphs[i]
		w = g[1]
		h = g[2]
		xadv = g[3]
		xo = g[4]
		yo = 1 - g[5]
		bitmap = bitmaps[g[0]:upto]
		if ver == 1:
			bitmap = tsdfont.font0_font1(w, h, bitmap)
		tsdfont.print_glyph(f, code, ver, w, h, xadv, xo, yo, bitmap)
		code = code + 1

	tsdfont.print_glyphs_footer(f, name, code0, code, yadv)
	tsdfont.print_fonts_list(f, name, tt)

def proc_file(f, lines, name):

	mode = -1
	bitmaps = []
	glyphs = []
	font = []

	n = 0
	for s in lines:
		i = 0
		while True:
			i = s.find('/*', i)
			if i >= 0:
				j = s.find('*/', i+2)
				if j:
					s = s[:i] + s[j+2:].strip() + '#' + s[i+2:j] + '\n'
					continue
			break
		s = s.replace('//', '#')
		if s.startswith('#'):
			continue
		if mode == -1:
			result = re.search(r"const\s+uint8_t\s+(\w+)Bitmaps\[\]\s*\w*\s*\=\s*\{", s)
			if result:
#				print(s)
				mode = 0
				continue

		if mode == -1:
			result = re.search(r"const\s+GFXglyph\s+(\w+)Glyphs\[\]\s*\w*\s*\=\s*\{", s)
			if result:
#				print(s)
				mode = 1
				continue

		if mode == -1:
			result = re.search(r"const\s+GFXfont\s+(\w+)\s*\w*\s*\=\s*\{", s)
			if result:
#				print(s)
				mode = 2
				n = 0;
				continue

		if mode == 0:
			i = s.find("};")
			if i >= 0:
				s = s[:i]
				mode = -1
			bitmaps.append(s)

		if mode == 1:
			i = s.find("};")
			if i >= 0:
				s = s[:i]
				mode = -1
			glyphs.append(s)

		if mode == 2:
			n = n + 1;
			if n < 3:
				continue
			i = s.find("};")
			if i >= 0:
				s = s[:i]
				mode = -1
			font.append(s)

	s = ''.join(bitmaps)
#	print(s)
	bi = eval( '[' + s + ']')
	s = ''.join(glyphs)
	s = s.replace('{', '[')
	s = s.replace('}', ']')
#	print(s)
	gl = eval( '[' + s + ']')
	s = ''.join(font)
#	print(s)
	fo = eval( '[' + s + ']')
	dump_font_file(f, bi, gl, fo[2], name)

def do_file(olddir, newdir, fname):
	print(fname)

	s = fname
	if s.endswith('.h'):
		s = s[:-2]

	if s.endswith('7b'):
		s = s[:-2]

	r = re.match('([A-Z_a-z]+)(\d+)pt', s)
	if r:
		s = r.group(1) + '_' + r.group(2) + 'pt'

	f = open(olddir + '/' + fname, 'r')
	lines = f.readlines();
	f.close()

	f = open(newdir + '/TSD_' + s +'.h', 'w')
	proc_file(f, lines, s)
	f.close()

def main():
	global ver

	if len(sys.argv) == 1:   # no arguments
		ver = 1

	oldfonts = "Fonts"
	newfonts = "TSDFonts"
	dirs = os.listdir( oldfonts )

	for fname in dirs:
		if fname.endswith('.h'):
			do_file(oldfonts, newfonts, fname)

main()
