from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import cv2

import open

fp = r'green_ai\komprimerad_Orto2019EPSG3009.tif'
mp = r'green_ai\web\model\unet_bata.hdf5'

orto = open.ortophoto(orto_path = fp, model_path=mp)

# <strong>#Set up Flaskstrong>:
app = Flask(__name__)
# <strong>#Set up Flask to bypass CORSstrong>:
cors = CORS(app)

#Create the receiver API POST endpoint:
@app.route("/receiver", methods=["POST"])
def postME():
	coords = request.get_json()
	# data = check_cords(Ekonomiska)

	# right_coords = []

	print(coords)

	# orto.crop_to_coord(coord=coords[0])
	orto.crop_poly(coords=coords)
	orto.pred()

	right_coords = jsonify(orto.gyf)

	return right_coords

if __name__ == "__main__": 
    # from waitress import serve
    # serve(app, host="0.0.0.0", port=8080)
	app.run(debug=True)