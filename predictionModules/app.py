from flask import Flask, request, jsonify
from flask_cors import CORS
from greenAI_helperfunctions import calcGYF, label_to_rgb
import numpy as np
import openOrto as openOrto
import cv2
from io import BytesIO
import base64
from waitress import serve

# Model paths and files
path = r''
fp = path + r'orto2019EPSG3009.tiff'
mp1 = path + r"models/resnet50_14cls_512size.hdf5"
mp2 = path + r"models/inceptionv3_13cls_512size.hdf5"

# Initializing orto object
orto = openOrto.ortophoto(orto_path=fp, model_path1=mp1, model_path2=mp2)

# Initializing Flask app
app = Flask(__name__)
# Setting up CORS bypass for Flask
cors = CORS(app)

# Route to serve the static file
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return app.send_static_file('index.html')

# API endpoint to get the progress of a process
@app.route('/api/progress', methods=['GET'])
def get_progress():
    return str(current_progress)

# Function to update the progress of a process
def update_progress(progress):
    global current_progress
    current_progress = int(progress)

# API endpoint to update some data
@app.route("/api/update", methods=["POST"])
def update():
    payload = request.get_json()
    poly = np.array(payload.get('segmented'))
    # Retrieve all area constants from payload
    # Calculate GYF
    gyf = calcGYF(poly,
                  float(payload.get('area_bush_constant')),
                  float(payload.get('area_grass_constant')),
                  float(payload.get('area_newTree_constant')),
                  float(payload.get('area_treeBig_constant')),
                  float(payload.get('area_treeMedium_constant')),
                  float(payload.get('area_treeSmall_constant')),
                  float(payload.get('area_playGr_constant')),
                  float(payload.get('area_social1_constant')),
                  float(payload.get('area_social2_constant')),
                  float(payload.get('area_social3_constant')),
                  float(payload.get('area_shadow_constant')),
                  float(payload.get('area_cultiVland_constant')),
                  float(payload.get('area_pergola_constant')))
    return jsonify(gyf)

# Function to color segmented image
def color_segmented_image_opencv(segmented_img):
    # Define the colormap
    colormap = np.array([
        [0, 0, 0],        # Outside
		[0, 191, 191],      # Road 
		[255, 255, 255],      # Building
		[255, 0, 0],      # Bush 
		[0, 240, 255],    # Cultivated Area
		[0, 255, 0],    # Grass
		[0, 155, 100],    # New Tree
		[0, 255, 255],  # Old Tree
		[0, 0, 255],   # Pergolla
		[255, 0, 255],    # Playground
		[255, 197, 163],    # Social Area 1
		[244, 29, 163],    # Social Area 2
		[128, 0, 128],    # Social Area 3
		[208, 176, 160],     # Shadow
    ]) 
    # Apply color mapping to the segmented image
    colored_img = colormap[segmented_img]
    # Create a blank canvas
    canvas = colored_img.astype(np.uint8)
    return canvas

# Function to remove padding from segmented image
def removePadding(segmented_image, original_image):
    width = original_image.shape[0]
    height = original_image.shape[1]
    # Calculate the coordinates for cropping the segmented image
    x_start = (segmented_image.shape[0] - width) // 2
    x_end = x_start + width
    y_start = (segmented_image.shape[1] - height) // 2
    y_end = y_start + height
    # Crop the segmented image using the calculated coordinates
    cropped_image = segmented_image[x_start:x_end, y_start:y_end]
    return cropped_image

# API endpoint to receive some data
@app.route("/api/receiver", methods=["POST"])
def postME():
    payload = request.get_json()
    coords = payload.get('coords')
    # Retrieve all area constants from payload
    # Perform any necessary processing with the values
    update_progress(0)
    orto.crop_poly(coords=coords)
    # Call the orto.pred function with the extracted values
    orto.pred(update_progress)
    # Calculate GYF
    gyf = calcGYF(orto.seg_img,
                  float(payload.get('area_bush_constant')),
                  float(payload.get('area_grass_constant')),
                  float(payload.get('area_newTree_constant')),
                  float(payload.get('area_treeBig_constant')),
                  float(payload.get('area_treeMedium_constant')),
                  float(payload.get('area_treeSmall_constant')),
                  float(payload.get('area_playGr_constant')),
                  float(payload.get('area_social1_constant')),
                  float(payload.get('area_social2_constant')),
                  float(payload.get('area_social3_constant')),
                  float(payload.get('area_shadow_constant')),
                  float(payload.get('area_cultiVland_constant')),
                  float(payload.get('area_pergola_constant')))
    colored_seg_img = color_segmented_image_opencv(orto.seg_img)
    colored_seg_img = removePadding(colored_seg_img, orto.poly_area)
    # Overlay the colored_seg_img_with_opacity on top of the poly_area
    _, encoded_orto = cv2.imencode('.jpg', orto.poly_area)
    _, encoded_segmented = cv2.imencode('.jpg', colored_seg_img)
    encoded_orto_string = base64.b64encode(encoded_orto).decode('utf-8')
    encoded_segmented_string = base64.b64encode(encoded_segmented).decode('utf-8')
    # returns raw segmented image, gyf, and the image with the polygon and segmented image side by side
    response = ({'segmentation': orto.seg_img.tolist(), 'gyf': gyf, 'orto_img': encoded_orto_string, 'segmented_img': encoded_segmented_string})
    return jsonify(response)

if __name__ == "__main__":
    current_progress = 0
    app.run()
