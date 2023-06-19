# GreenAI

This project is a web-based application that uses AI models to calculate the Green Area Index (GYF, Grönytefaktor) of a selected geographical area in Örebro, Sweden. The application integrates mapping and machine learning technologies to provide an interactive tool for users.

## Features

1. **Map Polygon Tool:** Enables users to draw a polygon around the area of interest directly on the interactive map. The tool is intuitive and easy to use, providing a user-friendly way to select specific geographical regions.

2. **Green Area Index Calculation:** Once an area is selected, the application uses machine learning segmentation models to analyze satellite imagery and calculate the Green Area Index. This process includes analyzing different types of green space such as bushes, grass, trees, and cultivated land.

3. **Visual Feedback:** The application provides visual feedback by displaying the analyzed area and corresponding green space segmentation directly on the map. This feature helps users understand the distribution of green spaces within their selected area. To display this use the hand tool to click the polygon.

## Installation and Usage

You can access the already up and running website at https://greenai.aass.oru.se

To use the application, navigate to the web page, use the map tool to circle an area, and then request the Green Area Index calculation. The result, along with the segmented image of the selected area, will be displayed once the calculation is complete.

## Update the website
To change anything on the website you can access the content under /var/www/html, all the files are located there. If the flask application would crash for any reason, run the app.py using tmux to keep it running.
 
## Future Work

Future updates aim to expand the available features and improve the AI models' accuracy and efficiency.

## Contributing

Interested in contributing to the Green Area Index for Örebro? We welcome any help in improving and expanding the project. Please read our contribution guidelines to get started.

## License

This project is licensed under the terms of the MIT license.
