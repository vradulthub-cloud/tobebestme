#!/bin/sh
# The demo loop: the three demo frames, each held about two seconds, crossfading back to the first.
set -e
cd "$(dirname "$0")/out"
F=0.45
ffmpeg -loglevel error -y -loop 1 -t 2.6 -i demo-frame-0.png -loop 1 -t 2.6 -i demo-frame-1.png -loop 1 -t 2.6 -i demo-frame-2.png -loop 1 -t 2.6 -i demo-frame-0.png \
  -filter_complex "[0][1]xfade=transition=fade:duration=$F:offset=2.15[a];[a][2]xfade=transition=fade:duration=$F:offset=4.3[b];[b][3]xfade=transition=fade:duration=$F:offset=6.45,format=yuv420p,fps=30" \
  -c:v libx264 -crf 18 -movflags +faststart demo.mp4
ffmpeg -loglevel error -y -i demo.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=sierra2_4a" -loop 0 demo.gif
