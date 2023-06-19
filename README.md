# GreenAI

This project is a web-based application that uses AI models to calculate the Green Area Index (GYF, Grönytefaktor) of a selected geographical area in Örebro, Sweden. The application integrates mapping and machine learning technologies to provide an interactive tool for users.

## Features

1. **Map Polygon Tool:** Enables users to draw a polygon around the area of interest directly on the interactive map. The tool is intuitive and easy to use, providing a user-friendly way to select specific geographical regions.

2. **Green Area Index Calculation:** Once an area is selected, the application uses machine learning segmentation models to analyze satellite imagery and calculate the Green Area Index. This process includes analyzing different types of green space such as bushes, grass, trees, and cultivated land.

3. **Visual Feedback:** The application provides visual feedback by displaying the analyzed area and corresponding green space segmentation directly on the map. This feature helps users understand the distribution of green spaces within their selected area.

## Website Usage

You can access the already up and running website at https://greenai.aass.oru.se

To use the application, navigate to the web page, use the polygon tool to circle an area and the ai will generate the Green Area Index. The result will be displayed once the calculation is complete. Use the hand tool and click the polygon to display the image along with the segmented image.

## Run locally

1. Clone this repo
2. Install the requirements from requirements.txt
3. Get an API key from Google with the Maps javascript API enabled.
4. Insert the API key in the URL on line 101 in index.html
5. Run app.py
6. Run index.html using 'live server' on visual studio code

## Update server website
To update the website on the server you will need to ssh into the server at herman@greenai.aass.oru.se with it's corresponding password. All the files are located at /var/www/html and should look almost identical to the files in this repo. 

> **Note** There are two differences that are crucial. When fetching the flask response in the javascript the command will be different. on the server all that is needed is '/api/(receiver, progress, update)' while locally you would need to add 'http://127.0.0.1:5000' if thats the ip your running on. The app.py is also slightly different on the server and locally. You will need to change the last if __name__=='__main__': statement. It's documented in the code. 

## Future Work

Future updates aim to expand the available features and improve the AI models' accuracy and efficiency.

## License

This project is licensed under the terms of the MIT license.
