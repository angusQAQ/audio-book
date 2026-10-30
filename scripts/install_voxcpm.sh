#!/usr/bin/env bash
set -euo pipefail
reader_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
voxcpm_env="${VOXCPM_VENV:-/workspace/.venvs/voxcpm}"
export PIP_CACHE_DIR="${PIP_CACHE_DIR:-/workspace/.cache/pip}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/workspace/.cache/voxcpm}"
export MPLCONFIGDIR="$XDG_CACHE_HOME/matplotlib"
export NUMBA_CACHE_DIR="$XDG_CACHE_HOME/numba"
export HF_HOME="${HF_HOME:-/workspace/.cache/huggingface}"
export MODELSCOPE_CACHE="${MODELSCOPE_CACHE:-/workspace/.cache/modelscope}"
mkdir -p "$PIP_CACHE_DIR" "$XDG_CACHE_HOME" "$MPLCONFIGDIR" "$NUMBA_CACHE_DIR" "$HF_HOME" "$MODELSCOPE_CACHE"
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
python3 -m venv "$voxcpm_env"
"$voxcpm_env/bin/python" -m pip install --disable-pip-version-check \
  --index-url https://download.pytorch.org/whl/cpu 'torch==2.7.1+cpu' 'torchaudio==2.7.1+cpu'
"$voxcpm_env/bin/python" -m pip install --disable-pip-version-check -r "$reader_root/requirements-voxcpm.txt"
"$voxcpm_env/bin/python" "$reader_root/scripts/voxcpm_sample.py" --check
