pub trait Coord
where
	Self: Clone + Copy,
{
	fn x(&self) -> f32;
	fn y(&self) -> f32;
}

#[derive(Clone, Copy, Debug, PartialEq, PartialOrd)]
pub struct Point {
	x: f32,
	y: f32,
}

impl Point {
	pub fn new(x: f32, y: f32) -> Self {
		Self { x, y }
	}
}

impl From<BitPoint> for Point {
	fn from(p: BitPoint) -> Self {
		Self::new(p.x(), p.y())
	}
}

impl Coord for Point {
	fn x(&self) -> f32 {
		self.x
	}

	fn y(&self) -> f32 {
		self.y
	}
}

const POINT_BITDEPTH: u32 = 15;
const MAX_POINT_VALUE: u32 = (1 << POINT_BITDEPTH) - 1;
const POINT_OFFSET: f32 = MAX_POINT_VALUE as f32 / 2.0;
const X_BITMASK: u32 = 0 | (MAX_POINT_VALUE << POINT_BITDEPTH);
const Y_BITMASK: u32 = 0 | MAX_POINT_VALUE;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct BitPoint(u32);

impl BitPoint {
	pub fn new(x: f32, y: f32) -> Self {
		Self::set_y(&Self::set_x(&Self(0), x), y)
	}
	pub fn from_raw(raw: u32) -> Self {
		Self(raw)
	}

	pub fn to_raw(self) -> u32 {
		self.0
	}

	// This is gonna go horribly wrong if a points coordinate is
	// bigger than 2 ** 15 (~32k), as it will overflow the 15bit
	// number we're using for one coordinate component
	fn set_x(&self, x: f32) -> Self {
		let x_val = (x + POINT_OFFSET) as u32;
		Self(self.0 | ((x_val << POINT_BITDEPTH) & X_BITMASK))
	}
	fn set_y(&self, y: f32) -> Self {
		let y_val = (y + POINT_OFFSET) as u32;
		Self(self.0 | (y_val & Y_BITMASK))
	}
}

impl Coord for BitPoint {
	fn x(&self) -> f32 {
		let val = (self.0 & X_BITMASK) >> POINT_BITDEPTH;
		val as f32 - POINT_OFFSET
	}
	fn y(&self) -> f32 {
		let val = self.0 & Y_BITMASK;
		val as f32 - POINT_OFFSET
	}
}

impl From<Point> for BitPoint {
	fn from(p: Point) -> Self {
		Self::new(p.x(), p.y())
	}
}
