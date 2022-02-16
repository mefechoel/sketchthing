# [Sketchthing](https://sketchthing.pages.dev/)

> Draw your face 🤡

![Outlines of a face](https://github.com/mefechoel/sketchthing/blob/main/example-pictures/face.jpg)

This is a thing that draws whatever your camera sees using configurable styles.
It does this by first detecting the edge points in an video frame, by reducing
the image's bit depth and storing all points that differ in color to that of
their neighbours. It then sorts this list of points, such that each point is
succeded by its nearest neighbour. This is done, so that distinguishable lines
can be drawn along the image's edges. The sorted list is then drawn using a
selected algorithm.

The options are, in order of their appearance in the ui:

- The resolution of the input image
- A percentage of points that is droped from the set of edge points
- The bit depth that is used to detect edges in the image
- The opacity of the background, which is redrawn on every frame
- The opacity of the line, which is redrawn on every frame
- Maximum length a line can have
- The thickness of a line
- The drawing algorithm that is used (points, curves, right-angled lines, lines)
- The algorithm, that is used to drop points from the set of edge points (either
  sequentially drop ever nth point or random)

The live camera feed can be paused using the pause button. Hide and show the
settings using the slider button. Save a picture using the save button.

Check out examples of what can be drawn using this tool in
[the `example-pictures` folder](https://github.com/mefechoel/sketchthing/blob/main/example-pictures/).

## Develop

Clone the repository, `cd` into the folder and install all dependencies by
running

```sh
npm install
```

If you're using VSCode, please install the
[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
and
[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
extensions.

You can then start a hot-reloading development server by running

```sh
npm run dev
```

To build it for production run

```sh
npm run build
```

You can preview the production build by running

```sh
npm run preview
```
