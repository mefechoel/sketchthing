extern crate cfg_if;
extern crate wasm_bindgen;

mod coord;
mod quadtree;
mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

use coord::{BitPoint, Coord, Point};
use quadtree::{QuadTree, Rectangle};

cfg_if! {
	if #[cfg(feature = "wee_alloc")] {
		#[global_allocator]
		static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
	}
}

fn sq_dist<T: Coord>(a: &T, b: &T) -> f64 {
	let dx = b.x() - a.x();
	let dy = b.y() - a.y();
	(dx * dx + dy * dy) as f64
}

fn sort_by_distance_2d<T: Coord>(
	points: Vec<T>,
	w: f32,
	h: f32,
	initial_search_radius: f32,
) -> Vec<T> {
	if points.len() <= 2 {
		return points.clone();
	}
	let mut qt = QuadTree::new(Rectangle::new(w / 2.0, h / 2.0, w, h));
	for p in points.iter() {
		qt.insert(*p);
	}
	let mut sorted: Vec<T> = Vec::with_capacity(points.len());
	let mut point = points[0];
	let num_points = qt.size();

	while sorted.len() < (num_points - 1) {
		qt.remove(&point);
		let mut search_radius = initial_search_radius;
		let found = loop {
			let search_range =
				Rectangle::new(point.x(), point.y(), search_radius, search_radius);
			let r = qt.query(&search_range);
			search_radius *= 2.0;
			if r.len() > 0 {
				break r;
			}
		};
		let mut closest: T = point;
		let mut closest_dist = f64::INFINITY;
		for i in 0..found.len() {
			let element = found[i];
			let d = sq_dist(&point, &element);
			if d < closest_dist {
				closest_dist = d;
				closest = element;
			}
		}
		sorted.push(point);
		point = closest;
	}
	sorted.push(point);

	sorted
}

#[wasm_bindgen]
pub fn sort(
	points: &[u32],
	w: f32,
	h: f32,
	initial_search_radius: f32,
) -> Box<[u32]> {
	utils::set_panic_hook();
	let points: Vec<Point> = points
		.iter()
		.map(|bit_point| BitPoint::from_raw(*bit_point).into())
		.collect();
	let sorted = sort_by_distance_2d(points, w, h, initial_search_radius);
	let sorted: Box<[u32]> = sorted
		.into_iter()
		.map(|point| BitPoint::from(point).to_raw())
		.collect();
	sorted
}

#[cfg(test)]
mod lib_test {
	use super::*;

	#[test]
	fn basic() {
		let sorted = sort_by_distance_2d(
			vec![
				Point::new(0.0, 0.0),
				Point::new(3.0, 3.0),
				Point::new(1.0, 1.0),
				Point::new(4.0, 4.0),
				Point::new(2.0, 2.0),
			],
			6.0,
			6.0,
			2.0,
		);
		let ordered = vec![
			Point::new(0.0, 0.0),
			Point::new(1.0, 1.0),
			Point::new(2.0, 2.0),
			Point::new(3.0, 3.0),
			Point::new(4.0, 4.0),
		];
		assert_eq!(sorted, ordered);
	}
}
