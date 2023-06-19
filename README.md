# GreenAI

This project is a web-based application that uses AI models to calculate the Green Area Index (GYF, Grönytefaktor) of a selected geographical area in Örebro, Sweden. The application integrates mapping and machine learning technologies to provide an interactive tool for users.

## Features

1. **Map Polygon Tool:** Enables users to draw a polygon around the area of interest directly on the interactive map. The tool is intuitive and easy to use, providing a user-friendly way to select specific geographical regions.

2. **Green Area Index Calculation:** Once an area is selected, the application uses machine learning segmentation models to analyze satellite imagery and calculate the Green Area Index. This process includes analyzing different types of green space such as bushes, grass, trees, and cultivated land.

3. **Visual Feedback:** The application provides visual feedback by displaying the analyzed area and corresponding green space segmentation directly on the map. This feature helps users understand the distribution of green spaces within their selected area.

## Website Usage

Visit our live website at https://greenai.aass.oru.se

To use the application, navigate to the web page, use the polygon tool to circle an area and the ai will generate the Green Area Index. The result will be displayed once the calculation is complete. To view the analyzed image along with the segmented one, use the hand tool and click on the polygon.

## Local Execution

1. Clone this repo
2. Install the requirements from requirements.txt
3. Obtain a Google API key with the Maps JavaScript API enabled.
4. Insert the API key in the URL on line 101 in index.html
5. Execute app.py
6. Launch index.html using 'live server' on visual studio code

## Server Website Update
To update the website on the server you will need to ssh into the server at herman@greenai.aass.oru.se using the corresponding password. All necessary files are located at /var/www/html and should closely mirror the files in this repository.

> **Note** Two crucial differences exist. The command to fetch the Flask response in the JavaScript will vary. On the server, '/api/(receiver, progress, update)' suffices, whereas locally, 'http://127.0.0.1:5000' should precede if that's the IP you're operating on. Similarly, app.py differs between the server and local contexts, requiring a change in the last if __name__=='__main__': statement. This is clearly documented within the code.

### Potential Updates
- Make a segmentation mask for the whole of Örebro into a ortophoto. In this way the user don't have to wait for the model to do the calculations and it would make the website inevitably faster.

### In case of website failure
If the website crashes or goes offline, it is likely due to the termination of app.py. To rectify this, SSH into the server and execute the command:

```
/usr/bin/tmux new-session -d -s myapp '/usr/bin/python3 /var/www/html/app.py >> /var/www/html/error.log 2>&1'
```

## Future Work

Future updates aim to expand the available features and improve the AI models' accuracy and efficiency.

## License

This project is licensed under the terms of the MIT license.
