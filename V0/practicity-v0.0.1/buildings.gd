extends Node3D

@export var building_scene: PackedScene

func place_building(grid_position: Vector2i):
	var building = building_scene.instantiate()
	building.position = tile_to_world(grid_position)
	add_child(building)

# Convertir des coordonnées de tuile en coordonnées monde
func tile_to_world(grid_pos: Vector2i) -> Vector3:
	var x = (grid_pos.x - grid_pos.y) * 64 / 2  # Largeur tuile / 2
	var z = (grid_pos.x + grid_pos.y) * 32 / 2  # Hauteur tuile / 2
	return Vector3(x, 0, z)
