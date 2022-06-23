use super::coord::Coord;

pub struct Rectangle {
	x: isize,
	y: isize,
	w: isize,
	h: isize,
	left: isize,
	right: isize,
	top: isize,
	bottom: isize,
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
	pub fn new(x: isize, y: isize, w: isize, h: isize) -> Self {
		Self {
			x,
			y,
			w,
			h,
			left: x - w / 2,
			right: x + w / 2,
			top: y - h / 2,
			bottom: y + h / 2,
		}
	}

	pub fn subdivide(&self, quadrant: &Quadrant) -> Self {
		match quadrant {
			Quadrant::NorthEast => Self::new(
				self.x + self.w / 4,
				self.y - self.h / 4,
				self.w / 2,
				self.h / 2,
			),
			Quadrant::SouthEast => Self::new(
				self.x + self.w / 4,
				self.y + self.h / 4,
				self.w / 2,
				self.h / 2,
			),
			Quadrant::NorthWest => Self::new(
				self.x - self.w / 4,
				self.y - self.h / 4,
				self.w / 2,
				self.h / 2,
			),
			Quadrant::SouthWest => Self::new(
				self.x - self.w / 4,
				self.y + self.h / 4,
				self.w / 2,
				self.h / 2,
			),
		}
	}
}

impl Queryable for Rectangle {
	fn contains<T: Coord>(&self, point: &T) -> bool {
		self.left <= point.x() &&
			point.x() <= self.right &&
			self.top <= point.y() &&
			point.y() <= self.bottom
	}

	fn intersects(&self, range: &Rectangle) -> bool {
		!(self.right < range.left ||
			range.right < self.left ||
			self.bottom < range.top ||
			range.bottom < self.top)
	}
}

pub struct Circle {
	x: isize,
	y: isize,
	r: f64,
	r_squared: f64,
}

impl Circle {
	pub fn new(x: isize, y: isize, r: f64) -> Self {
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
		let d = (point.x() - self.x).pow(2) + (point.y() - self.y).pow(2);
		return d as f64 <= self.r_squared;
	}

	fn intersects(&self, range: &Rectangle) -> bool {
		let x_dist = (range.x - self.x).abs();
		let y_dist = (range.y - self.y).abs();

		// radius of the circle
		let r = self.r;

		let w = range.w / 2;
		let h = range.h / 2;

		let edges = (x_dist - w).pow(2) + (y_dist - h).pow(2);

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

const DEFAULT_CAPACITY: usize = 32;

pub struct QuadTree<T: Coord> {
	root: Box<Node<T>>,
}
pub struct Node<T: Coord> {
	size: usize,
	boundary: Rectangle,
	capacity: usize,
	point: Option<T>,
	divided: bool,
	northeast: Option<Box<Node<T>>>,
	northwest: Option<Box<Node<T>>>,
	southeast: Option<Box<Node<T>>>,
	southwest: Option<Box<Node<T>>>,
}

impl<T: Coord> Node<T> {
	fn with_capacity(boundary: Rectangle, capacity: usize) -> Self {
		Self {
			size: 0,
			boundary,
			capacity,
			point: None,
			divided: false,
			northeast: None,
			northwest: None,
			southeast: None,
			southwest: None,
		}
	}

	fn subdivide(&mut self) {
		self.northeast = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::NorthEast),
			self.capacity,
		)));
		self.northwest = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::NorthWest),
			self.capacity,
		)));
		self.southeast = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::SouthEast),
			self.capacity,
		)));
		self.southwest = Some(Box::new(Self::with_capacity(
			self.boundary.subdivide(&Quadrant::SouthWest),
			self.capacity,
		)));

		self.divided = true;
	}

	fn contains(&self, point: &T) -> bool {
		if !self.boundary.contains(point) {
			return false;
		}

		let has_point = self
			.point
			.map_or(false, |p| p.x() == point.x() && p.y() == point.y());
		if has_point {
			return true;
		}
		if !self.divided {
			return false;
		}

		self
			.northeast
			.as_ref()
			.map_or(false, |node| node.contains(point)) ||
			self
				.northwest
				.as_ref()
				.map_or(false, |node| node.contains(point)) ||
			self
				.southeast
				.as_ref()
				.map_or(false, |node| node.contains(point)) ||
			self
				.southwest
				.as_ref()
				.map_or(false, |node| node.contains(point))
	}

	fn insert(&mut self, point: T) -> bool {
		if !self.boundary.contains(&point) {
			return false;
		}
		if self.contains(&point) {
			return false;
		}

		if self.point.is_none() {
			self.point = Some(point);
			self.size += 1;
			return true;
		}

		if !self.divided {
			self.subdivide();
		}

		let was_inserted = self
			.northeast
			.as_mut()
			.map_or(false, |node| node.insert(point)) ||
			self
				.northwest
				.as_mut()
				.map_or(false, |node| node.insert(point)) ||
			self
				.southeast
				.as_mut()
				.map_or(false, |node| node.insert(point)) ||
			self
				.southwest
				.as_mut()
				.map_or(false, |node| node.insert(point));

		self.size += if was_inserted { 1 } else { 0 };
		was_inserted
	}

	fn remove(&mut self, point: &T) -> bool {
		if !self.boundary.contains(point) {
			return false;
		}

		if let Some(p) = self.point {
			if p.x() == point.x() && p.y() == point.y() {
				self.point = None;
				self.size -= 1;
				return true;
			}
		}

		if !self.divided {
			return false;
		}

		let was_removed = self
			.northeast
			.as_mut()
			.map_or(false, |node| node.remove(point)) ||
			self
				.northwest
				.as_mut()
				.map_or(false, |node| node.remove(point)) ||
			self
				.southeast
				.as_mut()
				.map_or(false, |node| node.remove(point)) ||
			self
				.southwest
				.as_mut()
				.map_or(false, |node| node.remove(point));

		self.size -= if was_removed { 1 } else { 0 };
		was_removed
	}

	fn query<Q: Queryable>(&self, range: &Q, found: &mut Vec<T>) {
		if !range.intersects(&self.boundary) {
			return;
		}

		self.point.as_ref().map(|p| {
			if range.contains(p) {
				found.push(*p);
			}
		});
		if !self.divided {
			return;
		}

		self.northwest.as_ref().map(|node| node.query(range, found));
		self.northeast.as_ref().map(|node| node.query(range, found));
		self.southwest.as_ref().map(|node| node.query(range, found));
		self.southeast.as_ref().map(|node| node.query(range, found));
	}

	fn size(&self) -> usize {
		self.size
	}
}

impl<T: Coord> QuadTree<T> {
	pub fn with_capacity(boundary: Rectangle, capacity: usize) -> Self {
		Self {
			root: Box::new(Node::with_capacity(boundary, capacity)),
		}
	}

	pub fn new(boundary: Rectangle) -> Self {
		Self::with_capacity(boundary, DEFAULT_CAPACITY)
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

#[cfg(test)]
mod test {
	use std::collections::HashSet;

	use super::*;
	use crate::Point;

	#[test]
	fn rect() {
		let r = Rectangle::new(20, 20, 40, 40);
		assert_eq!(r.contains(&Point::new(0, 0)), true);
		assert_eq!(r.contains(&Point::new(20, 20)), true);
		assert_eq!(r.contains(&Point::new(39, 39)), true);
		assert_eq!(r.contains(&Point::new(40, 40)), true);
		assert_eq!(r.contains(&Point::new(41, 41)), false);
		assert_eq!(r.contains(&Point::new(50, 20)), false);
		assert_eq!(r.contains(&Point::new(20, 50)), false);
	}

	#[test]
	fn qt_new() {
		let qt = QuadTree::<Point>::new(Rectangle::new(20, 20, 40, 40));
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_with_capacity() {
		let qt =
			QuadTree::<Point>::with_capacity(Rectangle::new(20, 20, 40, 40), 4);
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_contains() {
		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
		qt.insert(Point::new(10, 10));
		qt.insert(Point::new(20, 20));
		qt.insert(Point::new(30, 30));
		assert!(qt.contains(&Point::new(10, 10)));
		assert!(qt.contains(&Point::new(20, 20)));
		assert!(qt.contains(&Point::new(30, 30)));
		assert!(!qt.contains(&Point::new(25, 25)));
		assert!(!qt.contains(&Point::new(300, 300)));
		qt.remove(&Point::new(30, 30));
		assert!(!qt.contains(&Point::new(30, 30)));
		assert!(qt.contains(&Point::new(10, 10)));
		assert!(qt.contains(&Point::new(20, 20)));
	}

	#[test]
	fn qt_insert() {
		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
		assert_eq!(qt.insert(Point::new(10, 10)), true);
		assert_eq!(qt.insert(Point::new(20, 20)), true);
		assert_eq!(qt.insert(Point::new(30, 30)), true);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.insert(Point::new(300, 300)), false);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.insert(Point::new(30, 30)), false);
		assert_eq!(qt.size(), 3);
	}

	#[test]
	fn qt_remove() {
		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));
		qt.insert(Point::new(10, 10));
		qt.insert(Point::new(20, 20));
		qt.insert(Point::new(30, 30));
		assert_eq!(qt.remove(&Point::new(25, 35)), false);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.remove(&Point::new(30, 30)), true);
		assert_eq!(qt.size(), 2);
		assert_eq!(qt.remove(&Point::new(30, 30)), false);
		assert_eq!(qt.size(), 2);
		assert_eq!(qt.remove(&Point::new(20, 20)), true);
		assert_eq!(qt.size(), 1);
		assert_eq!(qt.remove(&Point::new(10, 10)), true);
		assert_eq!(qt.size(), 0);
		assert_eq!(qt.remove(&Point::new(10, 10)), false);
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_query() {
		let mut qt = QuadTree::new(Rectangle::new(20, 20, 40, 40));

		let cluster_1 = vec![
			Point::new(10, 10),
			Point::new(8, 10),
			Point::new(12, 10),
			Point::new(10, 8),
			Point::new(10, 12),
		];
		let cluster_2 = vec![
			Point::new(20, 20),
			Point::new(18, 20),
			Point::new(22, 20),
			Point::new(20, 18),
			Point::new(20, 22),
		];
		let cluster_3 = vec![
			Point::new(30, 30),
			Point::new(28, 30),
			Point::new(32, 30),
			Point::new(30, 28),
			Point::new(30, 32),
		];
		let all_points: Vec<_> =
			vec![cluster_1.clone(), cluster_2.clone(), cluster_3.clone()]
				.into_iter()
				.flatten()
				.collect();
		for p in all_points {
			qt.insert(p);
		}

		let rect_1 = Rectangle::new(10, 10, 6, 6);
		let circle_1 = Circle::new(10, 10, 3.0);
		let rect_small_1 = Rectangle::new(10, 10, 1, 1);
		let circle_small_1 = Circle::new(10, 10, 0.5);

		let rect_2 = Rectangle::new(20, 20, 6, 6);
		let circle_2 = Circle::new(20, 20, 3.0);
		let rect_small_2 = Rectangle::new(20, 20, 1, 1);
		let circle_small_2 = Circle::new(20, 20, 0.5);

		let rect_3 = Rectangle::new(30, 30, 6, 6);
		let circle_3 = Circle::new(30, 30, 3.0);
		let rect_small_3 = Rectangle::new(30, 30, 1, 1);
		let circle_small_3 = Circle::new(30, 30, 0.5);

		fn assert_same_contents<Q: Queryable>(
			qt: &QuadTree<Point>,
			shape: &Q,
			expected: Vec<Point>,
		) {
			assert_eq!(
				HashSet::<Point>::from_iter(qt.query(shape)),
				HashSet::from_iter(expected.clone())
			);
		}

		assert_same_contents(&qt, &rect_1, cluster_1.clone());
		assert_same_contents(&qt, &circle_1, cluster_1.clone());
		assert_same_contents(&qt, &rect_small_1, vec![cluster_1[0]]);
		assert_same_contents(&qt, &circle_small_1, vec![cluster_1[0]]);

		assert_same_contents(&qt, &rect_2, cluster_2.clone());
		assert_same_contents(&qt, &circle_2, cluster_2.clone());
		assert_same_contents(&qt, &rect_small_2, vec![cluster_2[0]]);
		assert_same_contents(&qt, &circle_small_2, vec![cluster_2[0]]);

		assert_same_contents(&qt, &rect_3, cluster_3.clone());
		assert_same_contents(&qt, &circle_3, cluster_3.clone());
		assert_same_contents(&qt, &rect_small_3, vec![cluster_3[0]]);
		assert_same_contents(&qt, &circle_small_3, vec![cluster_3[0]]);

		assert_same_contents(&qt, &Rectangle::new(5, 5, 1, 1), vec![]);
	}
}
