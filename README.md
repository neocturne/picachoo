# PiCaChoo - The PictureCategoryChooser

PiCaChoo is an image (and video) viewer and organization tool. The Numpad
or arrow keys can be used to move files into up to 8 different directories.


## Build

```sh
yarn install
yarn package
```

The built application can be found in `out/$PLATFORM/picachoo`.


## Usage

Run the application by passing the path of your input directory on the command
line:

```sh
./picachoo ~/my-images
```

Then use the 8 "Browse..." buttons to choose the destination directory for
each directional key.

### Key bindings

- Home, End, Page Up, Page Down, Space: Navigate through the images of the input
  directory
- F5: Reload contents of input directory
- Numpad: Move current file into the directory configured for the corresponding
  direction. The Numpad 5 is neutral and will just navigate to the next file
  (same as Page Down and Space).
- Q, W, E, A, S, D, Z, X, C: Alternative to the numpad keys. This ignores the
  configured keyboard layout - for example, on a QWERTZ layout, the south-west
  direction would use the Y key instead of the Z key, so the keys are always
  arranged in a square.
- Arrow keys: Move current file into the directory configured for the
  corresponding direction. The diagonal directions can't be selected using the
  arrow keys.
- Backspace: Undo the last move. The number of undo operations is unlimited, but
  reloading the input directory using F5 will reset all undo information, so no
  moves that were done before the reload can be undone anymore.


## Missing features

- Incomplete error handling
- No mouse / touch control
- Source directory can only be specified on the command line
- Destination directories cannot be specified on the command line
- No INotify/... to watch input directory
