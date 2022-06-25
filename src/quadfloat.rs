use super::fcoord::Coord;

pub struct Rectangle {
	x: f32,
	y: f32,
	w: f32,
	h: f32,
	left: f32,
	right: f32,
	top: f32,
	bottom: f32,
}

pub enum Quadrant {
	NorthEast,
	SouthEast,
	NorthWest,
	SouthWest,
}

pub trait Queryable {
	fn intersects(&self, range: &Rectangle) -> bool;
	fn contains<T: Coord>(&self, point: &T) -> bool;
}

impl Rectangle {
	pub fn new(x: f32, y: f32, w: f32, h: f32) -> Self {
		Self {
			x,
			y,
			w,
			h,
			left: x - w / 2.0,
			right: x + w / 2.0,
			top: y - h / 2.0,
			bottom: y + h / 2.0,
		}
	}

	pub fn subdivide(&self, quadrant: &Quadrant) -> Self {
		match quadrant {
			Quadrant::NorthEast => Self::new(
				self.x + self.w / 4.0,
				self.y - self.h / 4.0,
				self.w / 2.0,
				self.h / 2.0,
			),
			Quadrant::SouthEast => Self::new(
				self.x + self.w / 4.0,
				self.y + self.h / 4.0,
				self.w / 2.0,
				self.h / 2.0,
			),
			Quadrant::NorthWest => Self::new(
				self.x - self.w / 4.0,
				self.y - self.h / 4.0,
				self.w / 2.0,
				self.h / 2.0,
			),
			Quadrant::SouthWest => Self::new(
				self.x - self.w / 4.0,
				self.y + self.h / 4.0,
				self.w / 2.0,
				self.h / 2.0,
			),
		}
	}
}

impl Queryable for Rectangle {
	fn contains<T: Coord>(&self, point: &T) -> bool {
		self.left <= point.x() &&
			point.x() < self.right &&
			self.top <= point.y() &&
			point.y() < self.bottom
	}

	fn intersects(&self, range: &Rectangle) -> bool {
		!(self.right < range.left ||
			range.right < self.left ||
			self.bottom < range.top ||
			range.bottom < self.top)
	}
}

pub struct Circle {
	x: f32,
	y: f32,
	r: f64,
	r_squared: f64,
}

impl Circle {
	pub fn new(x: f32, y: f32, r: f64) -> Self {
		Self {
			x,
			y,
			r,
			r_squared: r * r,
		}
	}
}

impl Queryable for Circle {
	fn contains<T: Coord>(&self, point: &T) -> bool {
		// check if the point is in the circle by checking if the euclidean distance of
		// the point and the center of the circle if smaller or equal to the radius of
		// the circle
		let d = (point.x() - self.x).powf(2.0) + (point.y() - self.y).powf(2.0);
		return d as f64 <= self.r_squared;
	}

	fn intersects(&self, range: &Rectangle) -> bool {
		let x_dist = (range.x - self.x).abs();
		let y_dist = (range.y - self.y).abs();

		// radius of the circle
		let r = self.r;

		let w = range.w / 2.0;
		let h = range.h / 2.0;

		let edges = (x_dist - w).powf(2.0) + (y_dist - h).powf(2.0);

		// no intersection
		if x_dist as f64 > r + w as f64 || y_dist as f64 > r + h as f64 {
			return false;
		}

		// intersection within the circle
		if x_dist <= w || y_dist <= h {
			return true;
		}

		// intersection on the edge of the circle
		return edges as f64 <= self.r_squared;
	}
}

const CAPACITY: usize = 2;

pub struct QuadTree<T: Coord> {
	root: Box<Node<T>>,
}

pub struct Node<T: Coord> {
	size: usize,
	boundary: Rectangle,
	points: Vec<T>,
	capacity: usize,
	divided: bool,
	northeast: Option<Box<Node<T>>>,
	northwest: Option<Box<Node<T>>>,
	southeast: Option<Box<Node<T>>>,
	southwest: Option<Box<Node<T>>>,
}

impl<T: Coord> Node<T> {
	fn new(boundary: Rectangle) -> Self {
		Self::with_capacity(boundary, CAPACITY)
	}

	fn with_capacity(boundary: Rectangle, capacity: usize) -> Self {
		Self {
			size: 0,
			boundary,
			points: Vec::new(),
			capacity,
			divided: false,
			northeast: None,
			northwest: None,
			southeast: None,
			southwest: None,
		}
	}

	fn subdivide(&mut self) {
		let capacity = self.capacity;
		self.northeast = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::NorthEast),
			capacity,
		)));
		self.northwest = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::NorthWest),
			capacity,
		)));
		self.southeast = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::SouthEast),
			capacity,
		)));
		self.southwest = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::SouthWest),
			capacity,
		)));

		self.divided = true;
	}

	fn contains(&self, point: &T) -> bool {
		if !self.boundary.contains(point) {
			return false;
		}

		let has_point = self
			.points
			.iter()
			.any(|p| p.x() == point.x() && p.y() == point.y());
		if has_point {
			return true;
		}
		if !self.divided {
			return false;
		}

		self.northeast.as_ref().unwrap().contains(point) ||
			self.northwest.as_ref().unwrap().contains(point) ||
			self.southeast.as_ref().unwrap().contains(point) ||
			self.southwest.as_ref().unwrap().contains(point)
	}

	fn insert(&mut self, point: T) -> bool {
		if !self.boundary.contains(&point) {
			return false;
		}
		if self.contains(&point) {
			return false;
		}

		if self.points.len() < self.capacity {
			self.points.push(point);
			self.size += 1;
			return true;
		}

		if !self.divided {
			self.subdivide();
		}

		let was_inserted = self.northeast.as_mut().unwrap().insert(point) ||
			self.northwest.as_mut().unwrap().insert(point) ||
			self.southeast.as_mut().unwrap().insert(point) ||
			self.southwest.as_mut().unwrap().insert(point);

		self.size += if was_inserted { 1 } else { 0 };
		was_inserted
	}

	fn remove(&mut self, point: &T) -> bool {
		if !self.boundary.contains(point) {
			return false;
		}

		let index = self
			.points
			.iter()
			.position(|p| p.x() == point.x() && p.y() == point.y());
		if let Some(i) = index {
			self.points.remove(i);
			self.size -= 1;
			return true;
		}

		if !self.divided {
			return false;
		}

		let was_removed = self.northeast.as_mut().unwrap().remove(point) ||
			self.northwest.as_mut().unwrap().remove(point) ||
			self.southeast.as_mut().unwrap().remove(point) ||
			self.southwest.as_mut().unwrap().remove(point);

		self.size -= if was_removed { 1 } else { 0 };
		was_removed
	}

	fn query<Q: Queryable>(&self, range: &Q, found: &mut Vec<T>) {
		if !range.intersects(&self.boundary) {
			return;
		}

		for p in self.points.iter() {
			if range.contains(p) {
				found.push(*p);
			}
		}
		if !self.divided {
			return;
		}

		self.northwest.as_ref().unwrap().query(range, found);
		self.northeast.as_ref().unwrap().query(range, found);
		self.southwest.as_ref().unwrap().query(range, found);
		self.southeast.as_ref().unwrap().query(range, found);
	}

	fn size(&self) -> usize {
		self.size
	}
}

impl<T: Coord> QuadTree<T> {
	pub fn new(boundary: Rectangle) -> Self {
		Self {
			root: Box::new(Node::new(boundary)),
		}
	}

	pub fn with_capacity(boundary: Rectangle, capacity: usize) -> Self {
		Self {
			root: Box::new(Node::with_capacity(boundary, capacity)),
		}
	}

	pub fn contains(&self, point: &T) -> bool {
		self.root.contains(point)
	}

	pub fn insert(&mut self, point: T) -> bool {
		self.root.insert(point)
	}

	pub fn remove(&mut self, point: &T) -> bool {
		self.root.remove(point)
	}

	pub fn query<Q: Queryable>(&self, range: &Q) -> Vec<T> {
		let mut found = Vec::<T>::new();
		self.root.query(range, &mut found);
		found
	}

	pub fn size(&self) -> usize {
		self.root.size()
	}
}

// #[cfg(test)]
// mod test {
// 	use std::collections::HashSet;

// 	use super::*;
// 	use crate::{BitPoint, Point};

// 	const BIT_POINTS: &str = include_str!("./points.txt");

// 	const P: fn(x: isize, y: isize) -> Point = Point::new;

// 	#[test]
// 	fn rect_contains() {
// 		let r = Rectangle::new(20, 20, 40, 40);
// 		assert!(r.contains(&P(0, 0)), "0, 0");
// 		assert!(r.contains(&P(0, 39)), "0, 39");
// 		assert!(r.contains(&P(39, 0)), "39, 0");
// 		assert!(r.contains(&P(20, 20)), "20, 20");
// 		assert!(!r.contains(&P(0, 40)), "0, 40");
// 		assert!(!r.contains(&P(40, 0)), "40, 0");
// 		assert!(!r.contains(&P(40, 40)), "40, 40");
// 	}

// 	#[test]
// 	fn huge() {
// 		let points: Vec<_> = BIT_POINTS
// 			.split_whitespace()
// 			.map(|bp_str| {
// 				bp_str
// 					.parse::<u32>()
// 					.expect("All of the contents of points.txt are numbers")
// 			})
// 			.map(BitPoint::from_raw)
// 			.map(Point::from)
// 			.collect();
// 		let point_len = points.len();
// 		let mut max_x = 0;
// 		let mut max_y = 0;
// 		for p in points.iter() {
// 			if p.x() > max_x {
// 				max_x = p.x();
// 			}
// 			if p.y() > max_y {
// 				max_y = p.y();
// 			}
// 		}
// 		let mut qt = QuadTree::<Point>::new(Rectangle::new(
// 			max_x as isize / 2,
// 			max_y as isize / 2,
// 			max_x as isize,
// 			max_y as isize,
// 		));
// 		for p in points {
// 			qt.insert(p);
// 		}
// 		assert_eq!(qt.size(), point_len);
// 	}

// 	#[test]
// 	fn rect() {
// 		let r = Rectangle::new(20, 20, 40, 40);
// 		assert_eq!(r.contains(&Point::new(0, 0)), true);
// 		assert_eq!(r.contains(&Point::new(20, 20)), true);
// 		assert_eq!(r.contains(&Point::new(39, 39)), true);
// 		assert_eq!(r.contains(&Point::new(40, 40)), true);
// 		assert_eq!(r.contains(&Point::new(41, 41)), false);
// 		assert_eq!(r.contains(&Point::new(50, 20)), false);
// 		assert_eq!(r.contains(&Point::new(20, 50)), false);
// 	}

// 	#[test]
// 	fn qt_new() {
// 		let qt = QuadTree::<Point>::new(Rectangle::new(20, 20, 40, 40));
// 		assert_eq!(qt.size(), 0);
// 	}

// 	#[test]
// 	fn qt_with_capacity() {
// 		let qt = QuadTree::<Point>::new(Rectangle::new(20, 20, 40, 40));
// 		assert_eq!(qt.size(), 0);
// 	}

// 	#[test]
// 	fn qt_contains() {
// 		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
// 		qt.insert(Point::new(10, 10));
// 		qt.insert(Point::new(20, 20));
// 		qt.insert(Point::new(30, 30));
// 		assert!(qt.contains(&Point::new(10, 10)));
// 		assert!(qt.contains(&Point::new(20, 20)));
// 		assert!(qt.contains(&Point::new(30, 30)));
// 		assert!(!qt.contains(&Point::new(25, 25)));
// 		assert!(!qt.contains(&Point::new(300, 300)));
// 		qt.remove(&Point::new(30, 30));
// 		assert!(!qt.contains(&Point::new(30, 30)));
// 		assert!(qt.contains(&Point::new(10, 10)));
// 		assert!(qt.contains(&Point::new(20, 20)));
// 	}

// 	#[test]
// 	fn qt_insert() {
// 		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
// 		assert_eq!(qt.insert(Point::new(10, 10)), true);
// 		assert_eq!(qt.insert(Point::new(20, 20)), true);
// 		assert_eq!(qt.insert(Point::new(30, 30)), true);
// 		assert_eq!(qt.size(), 3);
// 		assert_eq!(qt.insert(Point::new(300, 300)), false);
// 		assert_eq!(qt.size(), 3);
// 		assert_eq!(qt.insert(Point::new(30, 30)), false);
// 		assert_eq!(qt.size(), 3);
// 	}

// 	#[test]
// 	fn qt_remove() {
// 		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
// 		qt.insert(Point::new(10, 10));
// 		qt.insert(Point::new(20, 20));
// 		qt.insert(Point::new(30, 30));
// 		assert_eq!(qt.remove(&Point::new(25, 35)), false);
// 		assert_eq!(qt.size(), 3);
// 		assert_eq!(qt.remove(&Point::new(30, 30)), true);
// 		assert_eq!(qt.size(), 2);
// 		assert_eq!(qt.remove(&Point::new(30, 30)), false);
// 		assert_eq!(qt.size(), 2);
// 		assert_eq!(qt.remove(&Point::new(20, 20)), true);
// 		assert_eq!(qt.size(), 1);
// 		assert_eq!(qt.remove(&Point::new(10, 10)), true);
// 		assert_eq!(qt.size(), 0);
// 		assert_eq!(qt.remove(&Point::new(10, 10)), false);
// 		assert_eq!(qt.size(), 0);
// 	}

// 	#[test]
// 	fn qt_query() {
// 		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));

// 		let cluster_1 = vec![
// 			Point::new(10, 10),
// 			Point::new(8, 10),
// 			Point::new(12, 10),
// 			Point::new(10, 8),
// 			Point::new(10, 12),
// 		];
// 		let cluster_2 = vec![
// 			Point::new(20, 20),
// 			Point::new(18, 20),
// 			Point::new(22, 20),
// 			Point::new(20, 18),
// 			Point::new(20, 22),
// 		];
// 		let cluster_3 = vec![
// 			Point::new(30, 30),
// 			Point::new(28, 30),
// 			Point::new(32, 30),
// 			Point::new(30, 28),
// 			Point::new(30, 32),
// 		];
// 		let all_points: Vec<_> =
// 			vec![cluster_1.clone(), cluster_2.clone(), cluster_3.clone()]
// 				.into_iter()
// 				.flatten()
// 				.collect();
// 		for p in all_points {
// 			qt.insert(p);
// 		}

// 		let rect_1 = Rectangle::new(10, 10, 6, 6);
// 		let circle_1 = Circle::new(10, 10, 3.0);
// 		let rect_small_1 = Rectangle::new(10, 10, 1, 1);
// 		let circle_small_1 = Circle::new(10, 10, 0.5);

// 		let rect_2 = Rectangle::new(20, 20, 6, 6);
// 		let circle_2 = Circle::new(20, 20, 3.0);
// 		let rect_small_2 = Rectangle::new(20, 20, 1, 1);
// 		let circle_small_2 = Circle::new(20, 20, 0.5);

// 		let rect_3 = Rectangle::new(30, 30, 6, 6);
// 		let circle_3 = Circle::new(30, 30, 3.0);
// 		let rect_small_3 = Rectangle::new(30, 30, 1, 1);
// 		let circle_small_3 = Circle::new(30, 30, 0.5);

// 		fn assert_same_contents<Q: Queryable>(
// 			qt: &QuadTree<Point>,
// 			shape: &Q,
// 			expected: Vec<Point>,
// 		) {
// 			assert_eq!(
// 				HashSet::<Point>::from_iter(qt.query(shape)),
// 				HashSet::from_iter(expected.clone())
// 			);
// 		}

// 		assert_same_contents(&qt, &rect_1, cluster_1.clone());
// 		assert_same_contents(&qt, &circle_1, cluster_1.clone());
// 		assert_same_contents(&qt, &rect_small_1, vec![cluster_1[0]]);
// 		assert_same_contents(&qt, &circle_small_1, vec![cluster_1[0]]);

// 		assert_same_contents(&qt, &rect_2, cluster_2.clone());
// 		assert_same_contents(&qt, &circle_2, cluster_2.clone());
// 		assert_same_contents(&qt, &rect_small_2, vec![cluster_2[0]]);
// 		assert_same_contents(&qt, &circle_small_2, vec![cluster_2[0]]);

// 		assert_same_contents(&qt, &rect_3, cluster_3.clone());
// 		assert_same_contents(&qt, &circle_3, cluster_3.clone());
// 		assert_same_contents(&qt, &rect_small_3, vec![cluster_3[0]]);
// 		assert_same_contents(&qt, &circle_small_3, vec![cluster_3[0]]);

// 		assert_same_contents(&qt, &Rectangle::new(5, 5, 1, 1), vec![]);
// 	}
// }
