use super::coord::Coord;

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

const CAPACITY: usize = 8;

pub struct QuadTree<T: Coord> {
	root: Box<Node<T>>,
}

pub struct Node<T: Coord> {
	size: usize,
	own_size: usize,
	boundary: Rectangle,
	points: [Option<T>; CAPACITY],
	divided: bool,
	northeast: Option<Box<Node<T>>>,
	northwest: Option<Box<Node<T>>>,
	southeast: Option<Box<Node<T>>>,
	southwest: Option<Box<Node<T>>>,
}

impl<T: Coord> Node<T> {
	fn new(boundary: Rectangle) -> Self {
		Self {
			size: 0,
			own_size: 0,
			boundary,
			points: [None; CAPACITY],
			divided: false,
			northeast: None,
			northwest: None,
			southeast: None,
			southwest: None,
		}
	}

	fn subdivide(&mut self) {
		self.northeast = Some(Box::new(Self::new(
			self.boundary.subdivide(&Quadrant::NorthEast),
		)));
		self.northwest = Some(Box::new(Self::new(
			self.boundary.subdivide(&Quadrant::NorthWest),
		)));
		self.southeast = Some(Box::new(Self::new(
			self.boundary.subdivide(&Quadrant::SouthEast),
		)));
		self.southwest = Some(Box::new(Self::new(
			self.boundary.subdivide(&Quadrant::SouthWest),
		)));

		self.divided = true;
	}

	fn contains(&self, point: &T) -> bool {
		if !self.boundary.contains(point) {
			return false;
		}

		let has_point = self.points.iter().any(|p| {
			p.is_some() && p.unwrap().x() == point.x() && p.unwrap().y() == point.y()
		});
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

		if self.own_size < CAPACITY {
			let insertion_index =
				self.points.iter().position(|p| p.is_none()).expect(
					"We've checked before, if there is space left for a new point, so \
					 there must be an empty slot",
				);
			unsafe {
				*self.points.get_unchecked_mut(insertion_index) = Some(point);
			}
			self.own_size += 1;
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

		let index = self.points.iter().position(|p| {
			p.is_some() && p.unwrap().x() == point.x() && p.unwrap().y() == point.y()
		});
		if let Some(i) = index {
			unsafe {
				*self.points.get_unchecked_mut(i) = None;
			}
			self.own_size -= 1;
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
			if let Some(p) = p {
				if range.contains(p) {
					found.push(*p);
				}
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
	use super::*;
	use crate::{BitPoint, Point};

	const BIT_POINTS: &str = include_str!("./points.txt");

	const P: fn(x: f32, y: f32) -> Point = Point::new;

	#[test]
	fn rect_contains() {
		let r = Rectangle::new(20.0, 20.0, 40.0, 40.0);
		assert!(r.contains(&P(0.0, 0.0)), "0, 0");
		assert!(r.contains(&P(0.0, 39.0)), "0, 39");
		assert!(r.contains(&P(39.0, 0.0)), "39, 0");
		assert!(r.contains(&P(20.0, 20.0)), "20, 20");
		assert!(!r.contains(&P(0.0, 40.001)), "0, 40.001");
		assert!(!r.contains(&P(40.001, 0.0)), "40.001, 0");
		assert!(!r.contains(&P(40.001, 40.001)), "40.001, 40.001");
	}

	#[test]
	fn huge() {
		let points: Vec<_> = BIT_POINTS
			.split_whitespace()
			.map(|bp_str| {
				bp_str
					.parse::<u32>()
					.expect("All of the contents of points.txt are numbers")
			})
			.map(BitPoint::from_raw)
			.map(Point::from)
			.collect();
		let point_len = points.len();
		let mut max_x = 0.0;
		let mut max_y = 0.0;
		for p in points.iter() {
			if p.x() > max_x {
				max_x = p.x();
			}
			if p.y() > max_y {
				max_y = p.y();
			}
		}
		let mut qt = QuadTree::<Point>::new(Rectangle::new(
			max_x / 2.0,
			max_y / 2.0,
			max_x,
			max_y,
		));
		for p in points {
			qt.insert(p);
		}
		assert_eq!(qt.size(), point_len);
	}

	#[test]
	fn rect() {
		let r = Rectangle::new(20.0, 20.0, 40.0, 40.0);
		assert_eq!(r.contains(&Point::new(0.0, 0.0)), true, "0.0, 0.0");
		assert_eq!(r.contains(&Point::new(20.0, 20.0)), true, "20.0, 20.0");
		assert_eq!(r.contains(&Point::new(39.0, 39.0)), true, "39.0, 39.0");
		assert_eq!(
			r.contains(&Point::new(39.999, 39.999)),
			true,
			"39.999, 39.999"
		);
		assert_eq!(r.contains(&Point::new(40.0, 40.0)), true, "40.0, 40.0");
		assert_eq!(r.contains(&Point::new(41.0, 41.0)), false, "41.0, 41.0");
		assert_eq!(r.contains(&Point::new(50.0, 20.0)), false, "50.0, 20.0");
		assert_eq!(r.contains(&Point::new(20.0, 50.0)), false, "20.0, 50.0");
	}

	#[test]
	fn qt_new() {
		let qt = QuadTree::<Point>::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_with_capacity() {
		let qt = QuadTree::<Point>::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_contains() {
		let mut qt = QuadTree::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));
		qt.insert(Point::new(10.0, 10.0));
		qt.insert(Point::new(20.0, 20.0));
		qt.insert(Point::new(30.0, 30.0));
		assert!(qt.contains(&Point::new(10.0, 10.0)));
		assert!(qt.contains(&Point::new(20.0, 20.0)));
		assert!(qt.contains(&Point::new(30.0, 30.0)));
		assert!(!qt.contains(&Point::new(25.0, 25.0)));
		assert!(!qt.contains(&Point::new(300.0, 300.0)));
		qt.remove(&Point::new(30.0, 30.0));
		assert!(!qt.contains(&Point::new(30.0, 30.0)));
		assert!(qt.contains(&Point::new(10.0, 10.0)));
		assert!(qt.contains(&Point::new(20.0, 20.0)));
	}

	#[test]
	fn qt_insert() {
		let mut qt = QuadTree::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));
		assert_eq!(qt.insert(Point::new(10.0, 10.0)), true);
		assert_eq!(qt.insert(Point::new(20.0, 20.0)), true);
		assert_eq!(qt.insert(Point::new(30.0, 30.0)), true);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.insert(Point::new(300.0, 300.0)), false);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.insert(Point::new(30.0, 30.0)), false);
		assert_eq!(qt.size(), 3);
	}

	#[test]
	fn qt_remove() {
		let mut qt = QuadTree::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));
		qt.insert(Point::new(10.0, 10.0));
		qt.insert(Point::new(20.0, 20.0));
		qt.insert(Point::new(30.0, 30.0));
		assert_eq!(qt.remove(&Point::new(25.0, 35.0)), false);
		assert_eq!(qt.size(), 3);
		assert_eq!(qt.remove(&Point::new(30.0, 30.0)), true);
		assert_eq!(qt.size(), 2);
		assert_eq!(qt.remove(&Point::new(30.0, 30.0)), false);
		assert_eq!(qt.size(), 2);
		assert_eq!(qt.remove(&Point::new(20.0, 20.0)), true);
		assert_eq!(qt.size(), 1);
		assert_eq!(qt.remove(&Point::new(10.0, 10.0)), true);
		assert_eq!(qt.size(), 0);
		assert_eq!(qt.remove(&Point::new(10.0, 10.0)), false);
		assert_eq!(qt.size(), 0);
	}

	#[test]
	fn qt_query() {
		let mut qt = QuadTree::new(Rectangle::new(20.0, 20.0, 40.0, 40.0));

		let cluster_1 = vec![
			Point::new(10.0, 10.0),
			Point::new(8.0, 10.0),
			Point::new(12.0, 10.0),
			Point::new(10.0, 8.0),
			Point::new(10.0, 12.0),
		];
		let cluster_2 = vec![
			Point::new(20.0, 20.0),
			Point::new(18.0, 20.0),
			Point::new(22.0, 20.0),
			Point::new(20.0, 18.0),
			Point::new(20.0, 22.0),
		];
		let cluster_3 = vec![
			Point::new(30.0, 30.0),
			Point::new(28.0, 30.0),
			Point::new(32.0, 30.0),
			Point::new(30.0, 28.0),
			Point::new(30.0, 32.0),
		];
		let all_points: Vec<_> =
			vec![cluster_1.clone(), cluster_2.clone(), cluster_3.clone()]
				.into_iter()
				.flatten()
				.collect();
		for p in all_points {
			qt.insert(p);
		}

		let rect_1 = Rectangle::new(10.0, 10.0, 6.0, 6.0);
		let circle_1 = Circle::new(10.0, 10.0, 3.0);
		let rect_small_1 = Rectangle::new(10.0, 10.0, 1.0, 1.0);
		let circle_small_1 = Circle::new(10.0, 10.0, 0.5);

		let rect_2 = Rectangle::new(20.0, 20.0, 6.0, 6.0);
		let circle_2 = Circle::new(20.0, 20.0, 3.0);
		let rect_small_2 = Rectangle::new(20.0, 20.0, 1.0, 1.0);
		let circle_small_2 = Circle::new(20.0, 20.0, 0.5);

		let rect_3 = Rectangle::new(30.0, 30.0, 6.0, 6.0);
		let circle_3 = Circle::new(30.0, 30.0, 3.0);
		let rect_small_3 = Rectangle::new(30.0, 30.0, 1.0, 1.0);
		let circle_small_3 = Circle::new(30.0, 30.0, 0.5);

		fn assert_same_contents<Q: Queryable>(
			qt: &QuadTree<Point>,
			shape: &Q,
			expected: Vec<Point>,
			msg: &str,
		) {
			assert_eq!(
				qt.query(shape).sort_by(|a, b| a.partial_cmp(b).unwrap()),
				expected.clone().sort_by(|a, b| a.partial_cmp(b).unwrap()),
				"{}",
				msg
			);
		}

		assert_same_contents(&qt, &rect_1, cluster_1.clone(), "rect_1, cluster_1");
		assert_same_contents(
			&qt,
			&circle_1,
			cluster_1.clone(),
			"circle_1, cluster_1",
		);
		assert_same_contents(
			&qt,
			&rect_small_1,
			vec![cluster_1[0]],
			"rect_small_1, cluster_1[0]",
		);
		assert_same_contents(
			&qt,
			&circle_small_1,
			vec![cluster_1[0]],
			"circle_small_1, cluster_1[0]",
		);

		assert_same_contents(&qt, &rect_2, cluster_2.clone(), "rect_2, cluster_2");
		assert_same_contents(
			&qt,
			&circle_2,
			cluster_2.clone(),
			"circle_2, cluster_2",
		);
		assert_same_contents(
			&qt,
			&rect_small_2,
			vec![cluster_2[0]],
			"rect_small_2, cluster_2[0]",
		);
		assert_same_contents(
			&qt,
			&circle_small_2,
			vec![cluster_2[0]],
			"circle_small_2, cluster_2[0]",
		);

		assert_same_contents(&qt, &rect_3, cluster_3.clone(), "rect_3, cluster_3");
		assert_same_contents(
			&qt,
			&circle_3,
			cluster_3.clone(),
			"circle_3, cluster_3",
		);
		assert_same_contents(
			&qt,
			&rect_small_3,
			vec![cluster_3[0]],
			"rect_small_3, cluster_3[0]",
		);
		assert_same_contents(
			&qt,
			&circle_small_3,
			vec![cluster_3[0]],
			"circle_small_3, cluster_3[0]",
		);

		assert_same_contents(
			&qt,
			&Rectangle::new(5.0, 5.0, 1.0, 1.0),
			vec![],
			"5.0, 5.0, 1.0, 1.0",
		);
	}
}
