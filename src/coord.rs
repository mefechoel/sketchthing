pub trait Coord
where
	Self: Clone + Copy,
{
	fn x(&self) -> isize;
	fn y(&self) -> isize;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Point {
	x: isize,
	y: isize,
}

impl Point {
	pub fn new(x: isize, y: isize) -> Self {
		Self { x, y }
	}
}

impl From<BitPoint> for Point {
	fn from(p: BitPoint) -> Self {
		Self::new(p.x(), p.y())
	}
}

impl Coord for Point {
	fn x(&self) -> isize {
		self.x
	}

	fn y(&self) -> isize {
		self.y
	}
}

const POINT_BITDEPTH: u32 = 15;
const MAX_POINT_VALUE: u32 = (1 << POINT_BITDEPTH) - 1;
const POINT_OFFSET: isize = MAX_POINT_VALUE as isize / 2;
const X_BITMASK: u32 = 0 | (MAX_POINT_VALUE << POINT_BITDEPTH);
const Y_BITMASK: u32 = 0 | MAX_POINT_VALUE;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct BitPoint(u32);

impl BitPoint {
	pub fn new(x: isize, y: isize) -> Self {
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
	fn set_x(&self, x: isize) -> Self {
		let x_val = (x + POINT_OFFSET) as u32;
		Self(self.0 | ((x_val << POINT_BITDEPTH) & X_BITMASK))
	}
	fn set_y(&self, y: isize) -> Self {
		let y_val = (y + POINT_OFFSET) as u32;
		Self(self.0 | (y_val & Y_BITMASK))
	}
}

impl Coord for BitPoint {
	fn x(&self) -> isize {
		let val = (self.0 & X_BITMASK) >> POINT_BITDEPTH;
		val as isize - POINT_OFFSET
	}
	fn y(&self) -> isize {
		let val = self.0 & Y_BITMASK;
		val as isize - POINT_OFFSET
	}
}

impl From<Point> for BitPoint {
	fn from(p: Point) -> Self {
		Self::new(p.x(), p.y())
	}
}
