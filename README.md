# PiCaChoo - The PictureCategoryChooser

PiCaChoo is an image (and video) viewer and image organization tool. The arrow
keys can be used to move files into four different directories.


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

Then use the four "Browse..." buttons to choose the destination directory for
each arrow key.

### Key bindings

- Home, End, Page Up, Page Down, Space: Navigate through the images of the input
  directory
- F5: Reload contents of input directory
- Arrow keys: Move current file to one of the configured output directories
- Backspace: Undo the last move. The number of undo operations is unlimited, but
  reloading the input directory will reset all undo information.


## Missing features

- Incomplete error handling
- No mouse / touch control
- Source directory can only be specified on the command line
- Destination directories cannot be specified on the command line
- No INotify/... to watch input directory
