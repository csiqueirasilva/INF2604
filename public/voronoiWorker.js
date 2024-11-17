(function () {
	'use strict';

	/**
	 * @license
	 * Copyright 2010-2024 Three.js Authors
	 * SPDX-License-Identifier: MIT
	 */
	const REVISION = '166';

	// Color space string identifiers, matching CSS Color Module Level 4 and WebGPU names where available.
	const NoColorSpace = '';
	const SRGBColorSpace = 'srgb';
	const LinearSRGBColorSpace = 'srgb-linear';
	const DisplayP3ColorSpace = 'display-p3';
	const LinearDisplayP3ColorSpace = 'display-p3-linear';

	const LinearTransfer = 'linear';
	const SRGBTransfer = 'srgb';

	const Rec709Primaries = 'rec709';
	const P3Primaries = 'p3';

	function clamp( value, min, max ) {

		return Math.max( min, Math.min( max, value ) );

	}

	// compute euclidean modulo of m % n
	// https://en.wikipedia.org/wiki/Modulo_operation
	function euclideanModulo( n, m ) {

		return ( ( n % m ) + m ) % m;

	}

	// https://en.wikipedia.org/wiki/Linear_interpolation
	function lerp( x, y, t ) {

		return ( 1 - t ) * x + t * y;

	}

	class Matrix3 {

		constructor( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

			Matrix3.prototype.isMatrix3 = true;

			this.elements = [

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			];

			if ( n11 !== undefined ) {

				this.set( n11, n12, n13, n21, n22, n23, n31, n32, n33 );

			}

		}

		set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

			const te = this.elements;

			te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
			te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
			te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

			return this;

		}

		identity() {

			this.set(

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			);

			return this;

		}

		copy( m ) {

			const te = this.elements;
			const me = m.elements;

			te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
			te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
			te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

			return this;

		}

		extractBasis( xAxis, yAxis, zAxis ) {

			xAxis.setFromMatrix3Column( this, 0 );
			yAxis.setFromMatrix3Column( this, 1 );
			zAxis.setFromMatrix3Column( this, 2 );

			return this;

		}

		setFromMatrix4( m ) {

			const me = m.elements;

			this.set(

				me[ 0 ], me[ 4 ], me[ 8 ],
				me[ 1 ], me[ 5 ], me[ 9 ],
				me[ 2 ], me[ 6 ], me[ 10 ]

			);

			return this;

		}

		multiply( m ) {

			return this.multiplyMatrices( this, m );

		}

		premultiply( m ) {

			return this.multiplyMatrices( m, this );

		}

		multiplyMatrices( a, b ) {

			const ae = a.elements;
			const be = b.elements;
			const te = this.elements;

			const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
			const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
			const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

			const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
			const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
			const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
			te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
			te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
			te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
			te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
			te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
			te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

			return this;

		}

		multiplyScalar( s ) {

			const te = this.elements;

			te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
			te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
			te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

			return this;

		}

		determinant() {

			const te = this.elements;

			const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
				d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
				g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

			return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

		}

		invert() {

			const te = this.elements,

				n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
				n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
				n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

				t11 = n33 * n22 - n32 * n23,
				t12 = n32 * n13 - n33 * n12,
				t13 = n23 * n12 - n22 * n13,

				det = n11 * t11 + n21 * t12 + n31 * t13;

			if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

			const detInv = 1 / det;

			te[ 0 ] = t11 * detInv;
			te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
			te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

			te[ 3 ] = t12 * detInv;
			te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
			te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

			te[ 6 ] = t13 * detInv;
			te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
			te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

			return this;

		}

		transpose() {

			let tmp;
			const m = this.elements;

			tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
			tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
			tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

			return this;

		}

		getNormalMatrix( matrix4 ) {

			return this.setFromMatrix4( matrix4 ).invert().transpose();

		}

		transposeIntoArray( r ) {

			const m = this.elements;

			r[ 0 ] = m[ 0 ];
			r[ 1 ] = m[ 3 ];
			r[ 2 ] = m[ 6 ];
			r[ 3 ] = m[ 1 ];
			r[ 4 ] = m[ 4 ];
			r[ 5 ] = m[ 7 ];
			r[ 6 ] = m[ 2 ];
			r[ 7 ] = m[ 5 ];
			r[ 8 ] = m[ 8 ];

			return this;

		}

		setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

			const c = Math.cos( rotation );
			const s = Math.sin( rotation );

			this.set(
				sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
				- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
				0, 0, 1
			);

			return this;

		}

		//

		scale( sx, sy ) {

			this.premultiply( _m3.makeScale( sx, sy ) );

			return this;

		}

		rotate( theta ) {

			this.premultiply( _m3.makeRotation( - theta ) );

			return this;

		}

		translate( tx, ty ) {

			this.premultiply( _m3.makeTranslation( tx, ty ) );

			return this;

		}

		// for 2D Transforms

		makeTranslation( x, y ) {

			if ( x.isVector2 ) {

				this.set(

					1, 0, x.x,
					0, 1, x.y,
					0, 0, 1

				);

			} else {

				this.set(

					1, 0, x,
					0, 1, y,
					0, 0, 1

				);

			}

			return this;

		}

		makeRotation( theta ) {

			// counterclockwise

			const c = Math.cos( theta );
			const s = Math.sin( theta );

			this.set(

				c, - s, 0,
				s, c, 0,
				0, 0, 1

			);

			return this;

		}

		makeScale( x, y ) {

			this.set(

				x, 0, 0,
				0, y, 0,
				0, 0, 1

			);

			return this;

		}

		//

		equals( matrix ) {

			const te = this.elements;
			const me = matrix.elements;

			for ( let i = 0; i < 9; i ++ ) {

				if ( te[ i ] !== me[ i ] ) return false;

			}

			return true;

		}

		fromArray( array, offset = 0 ) {

			for ( let i = 0; i < 9; i ++ ) {

				this.elements[ i ] = array[ i + offset ];

			}

			return this;

		}

		toArray( array = [], offset = 0 ) {

			const te = this.elements;

			array[ offset ] = te[ 0 ];
			array[ offset + 1 ] = te[ 1 ];
			array[ offset + 2 ] = te[ 2 ];

			array[ offset + 3 ] = te[ 3 ];
			array[ offset + 4 ] = te[ 4 ];
			array[ offset + 5 ] = te[ 5 ];

			array[ offset + 6 ] = te[ 6 ];
			array[ offset + 7 ] = te[ 7 ];
			array[ offset + 8 ] = te[ 8 ];

			return array;

		}

		clone() {

			return new this.constructor().fromArray( this.elements );

		}

	}

	const _m3 = /*@__PURE__*/ new Matrix3();

	/**
	 * Matrices converting P3 <-> Rec. 709 primaries, without gamut mapping
	 * or clipping. Based on W3C specifications for sRGB and Display P3,
	 * and ICC specifications for the D50 connection space. Values in/out
	 * are _linear_ sRGB and _linear_ Display P3.
	 *
	 * Note that both sRGB and Display P3 use the sRGB transfer functions.
	 *
	 * Reference:
	 * - http://www.russellcottrell.com/photo/matrixCalculator.htm
	 */

	const LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = /*@__PURE__*/ new Matrix3().set(
		0.8224621, 0.177538, 0.0,
		0.0331941, 0.9668058, 0.0,
		0.0170827, 0.0723974, 0.9105199,
	);

	const LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = /*@__PURE__*/ new Matrix3().set(
		1.2249401, - 0.2249404, 0.0,
		- 0.0420569, 1.0420571, 0.0,
		- 0.0196376, - 0.0786361, 1.0982735
	);

	/**
	 * Defines supported color spaces by transfer function and primaries,
	 * and provides conversions to/from the Linear-sRGB reference space.
	 */
	const COLOR_SPACES = {
		[ LinearSRGBColorSpace ]: {
			transfer: LinearTransfer,
			primaries: Rec709Primaries,
			toReference: ( color ) => color,
			fromReference: ( color ) => color,
		},
		[ SRGBColorSpace ]: {
			transfer: SRGBTransfer,
			primaries: Rec709Primaries,
			toReference: ( color ) => color.convertSRGBToLinear(),
			fromReference: ( color ) => color.convertLinearToSRGB(),
		},
		[ LinearDisplayP3ColorSpace ]: {
			transfer: LinearTransfer,
			primaries: P3Primaries,
			toReference: ( color ) => color.applyMatrix3( LINEAR_DISPLAY_P3_TO_LINEAR_SRGB ),
			fromReference: ( color ) => color.applyMatrix3( LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 ),
		},
		[ DisplayP3ColorSpace ]: {
			transfer: SRGBTransfer,
			primaries: P3Primaries,
			toReference: ( color ) => color.convertSRGBToLinear().applyMatrix3( LINEAR_DISPLAY_P3_TO_LINEAR_SRGB ),
			fromReference: ( color ) => color.applyMatrix3( LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 ).convertLinearToSRGB(),
		},
	};

	const SUPPORTED_WORKING_COLOR_SPACES = new Set( [ LinearSRGBColorSpace, LinearDisplayP3ColorSpace ] );

	const ColorManagement = {

		enabled: true,

		_workingColorSpace: LinearSRGBColorSpace,

		get workingColorSpace() {

			return this._workingColorSpace;

		},

		set workingColorSpace( colorSpace ) {

			if ( ! SUPPORTED_WORKING_COLOR_SPACES.has( colorSpace ) ) {

				throw new Error( `Unsupported working color space, "${ colorSpace }".` );

			}

			this._workingColorSpace = colorSpace;

		},

		convert: function ( color, sourceColorSpace, targetColorSpace ) {

			if ( this.enabled === false || sourceColorSpace === targetColorSpace || ! sourceColorSpace || ! targetColorSpace ) {

				return color;

			}

			const sourceToReference = COLOR_SPACES[ sourceColorSpace ].toReference;
			const targetFromReference = COLOR_SPACES[ targetColorSpace ].fromReference;

			return targetFromReference( sourceToReference( color ) );

		},

		fromWorkingColorSpace: function ( color, targetColorSpace ) {

			return this.convert( color, this._workingColorSpace, targetColorSpace );

		},

		toWorkingColorSpace: function ( color, sourceColorSpace ) {

			return this.convert( color, sourceColorSpace, this._workingColorSpace );

		},

		getPrimaries: function ( colorSpace ) {

			return COLOR_SPACES[ colorSpace ].primaries;

		},

		getTransfer: function ( colorSpace ) {

			if ( colorSpace === NoColorSpace ) return LinearTransfer;

			return COLOR_SPACES[ colorSpace ].transfer;

		},

	};


	function SRGBToLinear( c ) {

		return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );

	}

	function LinearToSRGB( c ) {

		return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;

	}

	class Quaternion {

		constructor( x = 0, y = 0, z = 0, w = 1 ) {

			this.isQuaternion = true;

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

		}

		static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

			// fuzz-free, array-based Quaternion SLERP operation

			let x0 = src0[ srcOffset0 + 0 ],
				y0 = src0[ srcOffset0 + 1 ],
				z0 = src0[ srcOffset0 + 2 ],
				w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 + 0 ],
				y1 = src1[ srcOffset1 + 1 ],
				z1 = src1[ srcOffset1 + 2 ],
				w1 = src1[ srcOffset1 + 3 ];

			if ( t === 0 ) {

				dst[ dstOffset + 0 ] = x0;
				dst[ dstOffset + 1 ] = y0;
				dst[ dstOffset + 2 ] = z0;
				dst[ dstOffset + 3 ] = w0;
				return;

			}

			if ( t === 1 ) {

				dst[ dstOffset + 0 ] = x1;
				dst[ dstOffset + 1 ] = y1;
				dst[ dstOffset + 2 ] = z1;
				dst[ dstOffset + 3 ] = w1;
				return;

			}

			if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

				let s = 1 - t;
				const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
					dir = ( cos >= 0 ? 1 : - 1 ),
					sqrSin = 1 - cos * cos;

				// Skip the Slerp for tiny steps to avoid numeric problems:
				if ( sqrSin > Number.EPSILON ) {

					const sin = Math.sqrt( sqrSin ),
						len = Math.atan2( sin, cos * dir );

					s = Math.sin( s * len ) / sin;
					t = Math.sin( t * len ) / sin;

				}

				const tDir = t * dir;

				x0 = x0 * s + x1 * tDir;
				y0 = y0 * s + y1 * tDir;
				z0 = z0 * s + z1 * tDir;
				w0 = w0 * s + w1 * tDir;

				// Normalize in case we just did a lerp:
				if ( s === 1 - t ) {

					const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

					x0 *= f;
					y0 *= f;
					z0 *= f;
					w0 *= f;

				}

			}

			dst[ dstOffset ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;

		}

		static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

			const x0 = src0[ srcOffset0 ];
			const y0 = src0[ srcOffset0 + 1 ];
			const z0 = src0[ srcOffset0 + 2 ];
			const w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 ];
			const y1 = src1[ srcOffset1 + 1 ];
			const z1 = src1[ srcOffset1 + 2 ];
			const w1 = src1[ srcOffset1 + 3 ];

			dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
			dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
			dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
			dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

			return dst;

		}

		get x() {

			return this._x;

		}

		set x( value ) {

			this._x = value;
			this._onChangeCallback();

		}

		get y() {

			return this._y;

		}

		set y( value ) {

			this._y = value;
			this._onChangeCallback();

		}

		get z() {

			return this._z;

		}

		set z( value ) {

			this._z = value;
			this._onChangeCallback();

		}

		get w() {

			return this._w;

		}

		set w( value ) {

			this._w = value;
			this._onChangeCallback();

		}

		set( x, y, z, w ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

			this._onChangeCallback();

			return this;

		}

		clone() {

			return new this.constructor( this._x, this._y, this._z, this._w );

		}

		copy( quaternion ) {

			this._x = quaternion.x;
			this._y = quaternion.y;
			this._z = quaternion.z;
			this._w = quaternion.w;

			this._onChangeCallback();

			return this;

		}

		setFromEuler( euler, update = true ) {

			const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

			// http://www.mathworks.com/matlabcentral/fileexchange/
			// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
			//	content/SpinCalc.m

			const cos = Math.cos;
			const sin = Math.sin;

			const c1 = cos( x / 2 );
			const c2 = cos( y / 2 );
			const c3 = cos( z / 2 );

			const s1 = sin( x / 2 );
			const s2 = sin( y / 2 );
			const s3 = sin( z / 2 );

			switch ( order ) {

				case 'XYZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'YXZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'ZXY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'ZYX':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'YZX':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'XZY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				default:
					console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

			}

			if ( update === true ) this._onChangeCallback();

			return this;

		}

		setFromAxisAngle( axis, angle ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

			// assumes axis is normalized

			const halfAngle = angle / 2, s = Math.sin( halfAngle );

			this._x = axis.x * s;
			this._y = axis.y * s;
			this._z = axis.z * s;
			this._w = Math.cos( halfAngle );

			this._onChangeCallback();

			return this;

		}

		setFromRotationMatrix( m ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			const te = m.elements,

				m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
				m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
				m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

				trace = m11 + m22 + m33;

			if ( trace > 0 ) {

				const s = 0.5 / Math.sqrt( trace + 1.0 );

				this._w = 0.25 / s;
				this._x = ( m32 - m23 ) * s;
				this._y = ( m13 - m31 ) * s;
				this._z = ( m21 - m12 ) * s;

			} else if ( m11 > m22 && m11 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

				this._w = ( m32 - m23 ) / s;
				this._x = 0.25 * s;
				this._y = ( m12 + m21 ) / s;
				this._z = ( m13 + m31 ) / s;

			} else if ( m22 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

				this._w = ( m13 - m31 ) / s;
				this._x = ( m12 + m21 ) / s;
				this._y = 0.25 * s;
				this._z = ( m23 + m32 ) / s;

			} else {

				const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

				this._w = ( m21 - m12 ) / s;
				this._x = ( m13 + m31 ) / s;
				this._y = ( m23 + m32 ) / s;
				this._z = 0.25 * s;

			}

			this._onChangeCallback();

			return this;

		}

		setFromUnitVectors( vFrom, vTo ) {

			// assumes direction vectors vFrom and vTo are normalized

			let r = vFrom.dot( vTo ) + 1;

			if ( r < Number.EPSILON ) {

				// vFrom and vTo point in opposite directions

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					this._x = - vFrom.y;
					this._y = vFrom.x;
					this._z = 0;
					this._w = r;

				} else {

					this._x = 0;
					this._y = - vFrom.z;
					this._z = vFrom.y;
					this._w = r;

				}

			} else {

				// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

				this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
				this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
				this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
				this._w = r;

			}

			return this.normalize();

		}

		angleTo( q ) {

			return 2 * Math.acos( Math.abs( clamp( this.dot( q ), - 1, 1 ) ) );

		}

		rotateTowards( q, step ) {

			const angle = this.angleTo( q );

			if ( angle === 0 ) return this;

			const t = Math.min( 1, step / angle );

			this.slerp( q, t );

			return this;

		}

		identity() {

			return this.set( 0, 0, 0, 1 );

		}

		invert() {

			// quaternion is assumed to have unit length

			return this.conjugate();

		}

		conjugate() {

			this._x *= - 1;
			this._y *= - 1;
			this._z *= - 1;

			this._onChangeCallback();

			return this;

		}

		dot( v ) {

			return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

		}

		lengthSq() {

			return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

		}

		length() {

			return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

		}

		normalize() {

			let l = this.length();

			if ( l === 0 ) {

				this._x = 0;
				this._y = 0;
				this._z = 0;
				this._w = 1;

			} else {

				l = 1 / l;

				this._x = this._x * l;
				this._y = this._y * l;
				this._z = this._z * l;
				this._w = this._w * l;

			}

			this._onChangeCallback();

			return this;

		}

		multiply( q ) {

			return this.multiplyQuaternions( this, q );

		}

		premultiply( q ) {

			return this.multiplyQuaternions( q, this );

		}

		multiplyQuaternions( a, b ) {

			// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

			const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
			const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

			this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
			this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
			this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
			this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

			this._onChangeCallback();

			return this;

		}

		slerp( qb, t ) {

			if ( t === 0 ) return this;
			if ( t === 1 ) return this.copy( qb );

			const x = this._x, y = this._y, z = this._z, w = this._w;

			// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

			let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

			if ( cosHalfTheta < 0 ) {

				this._w = - qb._w;
				this._x = - qb._x;
				this._y = - qb._y;
				this._z = - qb._z;

				cosHalfTheta = - cosHalfTheta;

			} else {

				this.copy( qb );

			}

			if ( cosHalfTheta >= 1.0 ) {

				this._w = w;
				this._x = x;
				this._y = y;
				this._z = z;

				return this;

			}

			const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

			if ( sqrSinHalfTheta <= Number.EPSILON ) {

				const s = 1 - t;
				this._w = s * w + t * this._w;
				this._x = s * x + t * this._x;
				this._y = s * y + t * this._y;
				this._z = s * z + t * this._z;

				this.normalize(); // normalize calls _onChangeCallback()

				return this;

			}

			const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
			const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
			const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
				ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

			this._w = ( w * ratioA + this._w * ratioB );
			this._x = ( x * ratioA + this._x * ratioB );
			this._y = ( y * ratioA + this._y * ratioB );
			this._z = ( z * ratioA + this._z * ratioB );

			this._onChangeCallback();

			return this;

		}

		slerpQuaternions( qa, qb, t ) {

			return this.copy( qa ).slerp( qb, t );

		}

		random() {

			// sets this quaternion to a uniform random unit quaternnion

			// Ken Shoemake
			// Uniform random rotations
			// D. Kirk, editor, Graphics Gems III, pages 124-132. Academic Press, New York, 1992.

			const theta1 = 2 * Math.PI * Math.random();
			const theta2 = 2 * Math.PI * Math.random();

			const x0 = Math.random();
			const r1 = Math.sqrt( 1 - x0 );
			const r2 = Math.sqrt( x0 );

			return this.set(
				r1 * Math.sin( theta1 ),
				r1 * Math.cos( theta1 ),
				r2 * Math.sin( theta2 ),
				r2 * Math.cos( theta2 ),
			);

		}

		equals( quaternion ) {

			return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

		}

		fromArray( array, offset = 0 ) {

			this._x = array[ offset ];
			this._y = array[ offset + 1 ];
			this._z = array[ offset + 2 ];
			this._w = array[ offset + 3 ];

			this._onChangeCallback();

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this._x;
			array[ offset + 1 ] = this._y;
			array[ offset + 2 ] = this._z;
			array[ offset + 3 ] = this._w;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this._x = attribute.getX( index );
			this._y = attribute.getY( index );
			this._z = attribute.getZ( index );
			this._w = attribute.getW( index );

			this._onChangeCallback();

			return this;

		}

		toJSON() {

			return this.toArray();

		}

		_onChange( callback ) {

			this._onChangeCallback = callback;

			return this;

		}

		_onChangeCallback() {}

		*[ Symbol.iterator ]() {

			yield this._x;
			yield this._y;
			yield this._z;
			yield this._w;

		}

	}

	class Vector3 {

		constructor( x = 0, y = 0, z = 0 ) {

			Vector3.prototype.isVector3 = true;

			this.x = x;
			this.y = y;
			this.z = z;

		}

		set( x, y, z ) {

			if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

			this.x = x;
			this.y = y;
			this.z = z;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;
			this.z = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setZ( z ) {

			this.z = z;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				case 2: this.z = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				case 2: return this.z;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y, this.z );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;
			this.z = v.z;

			return this;

		}

		add( v ) {

			this.x += v.x;
			this.y += v.y;
			this.z += v.z;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;
			this.z += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;
			this.z = a.z + b.z;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;
			this.z += v.z * s;

			return this;

		}

		sub( v ) {

			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;
			this.z -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;
			this.z = a.z - b.z;

			return this;

		}

		multiply( v ) {

			this.x *= v.x;
			this.y *= v.y;
			this.z *= v.z;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;
			this.z *= scalar;

			return this;

		}

		multiplyVectors( a, b ) {

			this.x = a.x * b.x;
			this.y = a.y * b.y;
			this.z = a.z * b.z;

			return this;

		}

		applyEuler( euler ) {

			return this.applyQuaternion( _quaternion$4.setFromEuler( euler ) );

		}

		applyAxisAngle( axis, angle ) {

			return this.applyQuaternion( _quaternion$4.setFromAxisAngle( axis, angle ) );

		}

		applyMatrix3( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
			this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
			this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

			return this;

		}

		applyNormalMatrix( m ) {

			return this.applyMatrix3( m ).normalize();

		}

		applyMatrix4( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

			this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
			this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
			this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

			return this;

		}

		applyQuaternion( q ) {

			// quaternion q is assumed to have unit length

			const vx = this.x, vy = this.y, vz = this.z;
			const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

			// t = 2 * cross( q.xyz, v );
			const tx = 2 * ( qy * vz - qz * vy );
			const ty = 2 * ( qz * vx - qx * vz );
			const tz = 2 * ( qx * vy - qy * vx );

			// v + q.w * t + cross( q.xyz, t );
			this.x = vx + qw * tx + qy * tz - qz * ty;
			this.y = vy + qw * ty + qz * tx - qx * tz;
			this.z = vz + qw * tz + qx * ty - qy * tx;

			return this;

		}

		project( camera ) {

			return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

		}

		unproject( camera ) {

			return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

		}

		transformDirection( m ) {

			// input: THREE.Matrix4 affine matrix
			// vector interpreted as a direction

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
			this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
			this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

			return this.normalize();

		}

		divide( v ) {

			this.x /= v.x;
			this.y /= v.y;
			this.z /= v.z;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );
			this.z = Math.min( this.z, v.z );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );
			this.z = Math.max( this.z, v.z );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );
			this.z = Math.max( min.z, Math.min( max.z, this.z ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
			this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );
			this.z = Math.floor( this.z );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );
			this.z = Math.ceil( this.z );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );
			this.z = Math.round( this.z );

			return this;

		}

		roundToZero() {

			this.x = Math.trunc( this.x );
			this.y = Math.trunc( this.y );
			this.z = Math.trunc( this.z );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;
			this.z = - this.z;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y + this.z * v.z;

		}

		// TODO lengthSquared?

		lengthSq() {

			return this.x * this.x + this.y * this.y + this.z * this.z;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;
			this.z += ( v.z - this.z ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;
			this.z = v1.z + ( v2.z - v1.z ) * alpha;

			return this;

		}

		cross( v ) {

			return this.crossVectors( this, v );

		}

		crossVectors( a, b ) {

			const ax = a.x, ay = a.y, az = a.z;
			const bx = b.x, by = b.y, bz = b.z;

			this.x = ay * bz - az * by;
			this.y = az * bx - ax * bz;
			this.z = ax * by - ay * bx;

			return this;

		}

		projectOnVector( v ) {

			const denominator = v.lengthSq();

			if ( denominator === 0 ) return this.set( 0, 0, 0 );

			const scalar = v.dot( this ) / denominator;

			return this.copy( v ).multiplyScalar( scalar );

		}

		projectOnPlane( planeNormal ) {

			_vector$c.copy( this ).projectOnVector( planeNormal );

			return this.sub( _vector$c );

		}

		reflect( normal ) {

			// reflect incident vector off plane orthogonal to normal
			// normal is assumed to have unit length

			return this.sub( _vector$c.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		}

		angleTo( v ) {

			const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

			if ( denominator === 0 ) return Math.PI / 2;

			const theta = this.dot( v ) / denominator;

			// clamp, to handle numerical problems

			return Math.acos( clamp( theta, - 1, 1 ) );

		}

		distanceTo( v ) {

			return Math.sqrt( this.distanceToSquared( v ) );

		}

		distanceToSquared( v ) {

			const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

			return dx * dx + dy * dy + dz * dz;

		}

		manhattanDistanceTo( v ) {

			return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

		}

		setFromSpherical( s ) {

			return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

		}

		setFromSphericalCoords( radius, phi, theta ) {

			const sinPhiRadius = Math.sin( phi ) * radius;

			this.x = sinPhiRadius * Math.sin( theta );
			this.y = Math.cos( phi ) * radius;
			this.z = sinPhiRadius * Math.cos( theta );

			return this;

		}

		setFromCylindrical( c ) {

			return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

		}

		setFromCylindricalCoords( radius, theta, y ) {

			this.x = radius * Math.sin( theta );
			this.y = y;
			this.z = radius * Math.cos( theta );

			return this;

		}

		setFromMatrixPosition( m ) {

			const e = m.elements;

			this.x = e[ 12 ];
			this.y = e[ 13 ];
			this.z = e[ 14 ];

			return this;

		}

		setFromMatrixScale( m ) {

			const sx = this.setFromMatrixColumn( m, 0 ).length();
			const sy = this.setFromMatrixColumn( m, 1 ).length();
			const sz = this.setFromMatrixColumn( m, 2 ).length();

			this.x = sx;
			this.y = sy;
			this.z = sz;

			return this;

		}

		setFromMatrixColumn( m, index ) {

			return this.fromArray( m.elements, index * 4 );

		}

		setFromMatrix3Column( m, index ) {

			return this.fromArray( m.elements, index * 3 );

		}

		setFromEuler( e ) {

			this.x = e._x;
			this.y = e._y;
			this.z = e._z;

			return this;

		}

		setFromColor( c ) {

			this.x = c.r;
			this.y = c.g;
			this.z = c.b;

			return this;

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];
			this.z = array[ offset + 2 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;
			array[ offset + 2 ] = this.z;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );
			this.z = attribute.getZ( index );

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();
			this.z = Math.random();

			return this;

		}

		randomDirection() {

			// https://mathworld.wolfram.com/SpherePointPicking.html

			const theta = Math.random() * Math.PI * 2;
			const u = Math.random() * 2 - 1;
			const c = Math.sqrt( 1 - u * u );

			this.x = c * Math.cos( theta );
			this.y = u;
			this.z = c * Math.sin( theta );

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;
			yield this.z;

		}

	}

	const _vector$c = /*@__PURE__*/ new Vector3();
	const _quaternion$4 = /*@__PURE__*/ new Quaternion();

	const _colorKeywords = { 'aliceblue': 0xF0F8FF, 'antiquewhite': 0xFAEBD7, 'aqua': 0x00FFFF, 'aquamarine': 0x7FFFD4, 'azure': 0xF0FFFF,
		'beige': 0xF5F5DC, 'bisque': 0xFFE4C4, 'black': 0x000000, 'blanchedalmond': 0xFFEBCD, 'blue': 0x0000FF, 'blueviolet': 0x8A2BE2,
		'brown': 0xA52A2A, 'burlywood': 0xDEB887, 'cadetblue': 0x5F9EA0, 'chartreuse': 0x7FFF00, 'chocolate': 0xD2691E, 'coral': 0xFF7F50,
		'cornflowerblue': 0x6495ED, 'cornsilk': 0xFFF8DC, 'crimson': 0xDC143C, 'cyan': 0x00FFFF, 'darkblue': 0x00008B, 'darkcyan': 0x008B8B,
		'darkgoldenrod': 0xB8860B, 'darkgray': 0xA9A9A9, 'darkgreen': 0x006400, 'darkgrey': 0xA9A9A9, 'darkkhaki': 0xBDB76B, 'darkmagenta': 0x8B008B,
		'darkolivegreen': 0x556B2F, 'darkorange': 0xFF8C00, 'darkorchid': 0x9932CC, 'darkred': 0x8B0000, 'darksalmon': 0xE9967A, 'darkseagreen': 0x8FBC8F,
		'darkslateblue': 0x483D8B, 'darkslategray': 0x2F4F4F, 'darkslategrey': 0x2F4F4F, 'darkturquoise': 0x00CED1, 'darkviolet': 0x9400D3,
		'deeppink': 0xFF1493, 'deepskyblue': 0x00BFFF, 'dimgray': 0x696969, 'dimgrey': 0x696969, 'dodgerblue': 0x1E90FF, 'firebrick': 0xB22222,
		'floralwhite': 0xFFFAF0, 'forestgreen': 0x228B22, 'fuchsia': 0xFF00FF, 'gainsboro': 0xDCDCDC, 'ghostwhite': 0xF8F8FF, 'gold': 0xFFD700,
		'goldenrod': 0xDAA520, 'gray': 0x808080, 'green': 0x008000, 'greenyellow': 0xADFF2F, 'grey': 0x808080, 'honeydew': 0xF0FFF0, 'hotpink': 0xFF69B4,
		'indianred': 0xCD5C5C, 'indigo': 0x4B0082, 'ivory': 0xFFFFF0, 'khaki': 0xF0E68C, 'lavender': 0xE6E6FA, 'lavenderblush': 0xFFF0F5, 'lawngreen': 0x7CFC00,
		'lemonchiffon': 0xFFFACD, 'lightblue': 0xADD8E6, 'lightcoral': 0xF08080, 'lightcyan': 0xE0FFFF, 'lightgoldenrodyellow': 0xFAFAD2, 'lightgray': 0xD3D3D3,
		'lightgreen': 0x90EE90, 'lightgrey': 0xD3D3D3, 'lightpink': 0xFFB6C1, 'lightsalmon': 0xFFA07A, 'lightseagreen': 0x20B2AA, 'lightskyblue': 0x87CEFA,
		'lightslategray': 0x778899, 'lightslategrey': 0x778899, 'lightsteelblue': 0xB0C4DE, 'lightyellow': 0xFFFFE0, 'lime': 0x00FF00, 'limegreen': 0x32CD32,
		'linen': 0xFAF0E6, 'magenta': 0xFF00FF, 'maroon': 0x800000, 'mediumaquamarine': 0x66CDAA, 'mediumblue': 0x0000CD, 'mediumorchid': 0xBA55D3,
		'mediumpurple': 0x9370DB, 'mediumseagreen': 0x3CB371, 'mediumslateblue': 0x7B68EE, 'mediumspringgreen': 0x00FA9A, 'mediumturquoise': 0x48D1CC,
		'mediumvioletred': 0xC71585, 'midnightblue': 0x191970, 'mintcream': 0xF5FFFA, 'mistyrose': 0xFFE4E1, 'moccasin': 0xFFE4B5, 'navajowhite': 0xFFDEAD,
		'navy': 0x000080, 'oldlace': 0xFDF5E6, 'olive': 0x808000, 'olivedrab': 0x6B8E23, 'orange': 0xFFA500, 'orangered': 0xFF4500, 'orchid': 0xDA70D6,
		'palegoldenrod': 0xEEE8AA, 'palegreen': 0x98FB98, 'paleturquoise': 0xAFEEEE, 'palevioletred': 0xDB7093, 'papayawhip': 0xFFEFD5, 'peachpuff': 0xFFDAB9,
		'peru': 0xCD853F, 'pink': 0xFFC0CB, 'plum': 0xDDA0DD, 'powderblue': 0xB0E0E6, 'purple': 0x800080, 'rebeccapurple': 0x663399, 'red': 0xFF0000, 'rosybrown': 0xBC8F8F,
		'royalblue': 0x4169E1, 'saddlebrown': 0x8B4513, 'salmon': 0xFA8072, 'sandybrown': 0xF4A460, 'seagreen': 0x2E8B57, 'seashell': 0xFFF5EE,
		'sienna': 0xA0522D, 'silver': 0xC0C0C0, 'skyblue': 0x87CEEB, 'slateblue': 0x6A5ACD, 'slategray': 0x708090, 'slategrey': 0x708090, 'snow': 0xFFFAFA,
		'springgreen': 0x00FF7F, 'steelblue': 0x4682B4, 'tan': 0xD2B48C, 'teal': 0x008080, 'thistle': 0xD8BFD8, 'tomato': 0xFF6347, 'turquoise': 0x40E0D0,
		'violet': 0xEE82EE, 'wheat': 0xF5DEB3, 'white': 0xFFFFFF, 'whitesmoke': 0xF5F5F5, 'yellow': 0xFFFF00, 'yellowgreen': 0x9ACD32 };

	const _hslA = { h: 0, s: 0, l: 0 };
	const _hslB = { h: 0, s: 0, l: 0 };

	function hue2rgb( p, q, t ) {

		if ( t < 0 ) t += 1;
		if ( t > 1 ) t -= 1;
		if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
		if ( t < 1 / 2 ) return q;
		if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
		return p;

	}

	class Color {

		constructor( r, g, b ) {

			this.isColor = true;

			this.r = 1;
			this.g = 1;
			this.b = 1;

			return this.set( r, g, b );

		}

		set( r, g, b ) {

			if ( g === undefined && b === undefined ) {

				// r is THREE.Color, hex or string

				const value = r;

				if ( value && value.isColor ) {

					this.copy( value );

				} else if ( typeof value === 'number' ) {

					this.setHex( value );

				} else if ( typeof value === 'string' ) {

					this.setStyle( value );

				}

			} else {

				this.setRGB( r, g, b );

			}

			return this;

		}

		setScalar( scalar ) {

			this.r = scalar;
			this.g = scalar;
			this.b = scalar;

			return this;

		}

		setHex( hex, colorSpace = SRGBColorSpace ) {

			hex = Math.floor( hex );

			this.r = ( hex >> 16 & 255 ) / 255;
			this.g = ( hex >> 8 & 255 ) / 255;
			this.b = ( hex & 255 ) / 255;

			ColorManagement.toWorkingColorSpace( this, colorSpace );

			return this;

		}

		setRGB( r, g, b, colorSpace = ColorManagement.workingColorSpace ) {

			this.r = r;
			this.g = g;
			this.b = b;

			ColorManagement.toWorkingColorSpace( this, colorSpace );

			return this;

		}

		setHSL( h, s, l, colorSpace = ColorManagement.workingColorSpace ) {

			// h,s,l ranges are in 0.0 - 1.0
			h = euclideanModulo( h, 1 );
			s = clamp( s, 0, 1 );
			l = clamp( l, 0, 1 );

			if ( s === 0 ) {

				this.r = this.g = this.b = l;

			} else {

				const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
				const q = ( 2 * l ) - p;

				this.r = hue2rgb( q, p, h + 1 / 3 );
				this.g = hue2rgb( q, p, h );
				this.b = hue2rgb( q, p, h - 1 / 3 );

			}

			ColorManagement.toWorkingColorSpace( this, colorSpace );

			return this;

		}

		setStyle( style, colorSpace = SRGBColorSpace ) {

			function handleAlpha( string ) {

				if ( string === undefined ) return;

				if ( parseFloat( string ) < 1 ) {

					console.warn( 'THREE.Color: Alpha component of ' + style + ' will be ignored.' );

				}

			}


			let m;

			if ( m = /^(\w+)\(([^\)]*)\)/.exec( style ) ) {

				// rgb / hsl

				let color;
				const name = m[ 1 ];
				const components = m[ 2 ];

				switch ( name ) {

					case 'rgb':
					case 'rgba':

						if ( color = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// rgb(255,0,0) rgba(255,0,0,0.5)

							handleAlpha( color[ 4 ] );

							return this.setRGB(
								Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255,
								Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255,
								Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255,
								colorSpace
							);

						}

						if ( color = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)

							handleAlpha( color[ 4 ] );

							return this.setRGB(
								Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100,
								Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100,
								Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100,
								colorSpace
							);

						}

						break;

					case 'hsl':
					case 'hsla':

						if ( color = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec( components ) ) {

							// hsl(120,50%,50%) hsla(120,50%,50%,0.5)

							handleAlpha( color[ 4 ] );

							return this.setHSL(
								parseFloat( color[ 1 ] ) / 360,
								parseFloat( color[ 2 ] ) / 100,
								parseFloat( color[ 3 ] ) / 100,
								colorSpace
							);

						}

						break;

					default:

						console.warn( 'THREE.Color: Unknown color model ' + style );

				}

			} else if ( m = /^\#([A-Fa-f\d]+)$/.exec( style ) ) {

				// hex color

				const hex = m[ 1 ];
				const size = hex.length;

				if ( size === 3 ) {

					// #ff0
					return this.setRGB(
						parseInt( hex.charAt( 0 ), 16 ) / 15,
						parseInt( hex.charAt( 1 ), 16 ) / 15,
						parseInt( hex.charAt( 2 ), 16 ) / 15,
						colorSpace
					);

				} else if ( size === 6 ) {

					// #ff0000
					return this.setHex( parseInt( hex, 16 ), colorSpace );

				} else {

					console.warn( 'THREE.Color: Invalid hex color ' + style );

				}

			} else if ( style && style.length > 0 ) {

				return this.setColorName( style, colorSpace );

			}

			return this;

		}

		setColorName( style, colorSpace = SRGBColorSpace ) {

			// color keywords
			const hex = _colorKeywords[ style.toLowerCase() ];

			if ( hex !== undefined ) {

				// red
				this.setHex( hex, colorSpace );

			} else {

				// unknown color
				console.warn( 'THREE.Color: Unknown color ' + style );

			}

			return this;

		}

		clone() {

			return new this.constructor( this.r, this.g, this.b );

		}

		copy( color ) {

			this.r = color.r;
			this.g = color.g;
			this.b = color.b;

			return this;

		}

		copySRGBToLinear( color ) {

			this.r = SRGBToLinear( color.r );
			this.g = SRGBToLinear( color.g );
			this.b = SRGBToLinear( color.b );

			return this;

		}

		copyLinearToSRGB( color ) {

			this.r = LinearToSRGB( color.r );
			this.g = LinearToSRGB( color.g );
			this.b = LinearToSRGB( color.b );

			return this;

		}

		convertSRGBToLinear() {

			this.copySRGBToLinear( this );

			return this;

		}

		convertLinearToSRGB() {

			this.copyLinearToSRGB( this );

			return this;

		}

		getHex( colorSpace = SRGBColorSpace ) {

			ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

			return Math.round( clamp( _color.r * 255, 0, 255 ) ) * 65536 + Math.round( clamp( _color.g * 255, 0, 255 ) ) * 256 + Math.round( clamp( _color.b * 255, 0, 255 ) );

		}

		getHexString( colorSpace = SRGBColorSpace ) {

			return ( '000000' + this.getHex( colorSpace ).toString( 16 ) ).slice( - 6 );

		}

		getHSL( target, colorSpace = ColorManagement.workingColorSpace ) {

			// h,s,l ranges are in 0.0 - 1.0

			ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

			const r = _color.r, g = _color.g, b = _color.b;

			const max = Math.max( r, g, b );
			const min = Math.min( r, g, b );

			let hue, saturation;
			const lightness = ( min + max ) / 2.0;

			if ( min === max ) {

				hue = 0;
				saturation = 0;

			} else {

				const delta = max - min;

				saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

				switch ( max ) {

					case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
					case g: hue = ( b - r ) / delta + 2; break;
					case b: hue = ( r - g ) / delta + 4; break;

				}

				hue /= 6;

			}

			target.h = hue;
			target.s = saturation;
			target.l = lightness;

			return target;

		}

		getRGB( target, colorSpace = ColorManagement.workingColorSpace ) {

			ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

			target.r = _color.r;
			target.g = _color.g;
			target.b = _color.b;

			return target;

		}

		getStyle( colorSpace = SRGBColorSpace ) {

			ColorManagement.fromWorkingColorSpace( _color.copy( this ), colorSpace );

			const r = _color.r, g = _color.g, b = _color.b;

			if ( colorSpace !== SRGBColorSpace ) {

				// Requires CSS Color Module Level 4 (https://www.w3.org/TR/css-color-4/).
				return `color(${ colorSpace } ${ r.toFixed( 3 ) } ${ g.toFixed( 3 ) } ${ b.toFixed( 3 ) })`;

			}

			return `rgb(${ Math.round( r * 255 ) },${ Math.round( g * 255 ) },${ Math.round( b * 255 ) })`;

		}

		offsetHSL( h, s, l ) {

			this.getHSL( _hslA );

			return this.setHSL( _hslA.h + h, _hslA.s + s, _hslA.l + l );

		}

		add( color ) {

			this.r += color.r;
			this.g += color.g;
			this.b += color.b;

			return this;

		}

		addColors( color1, color2 ) {

			this.r = color1.r + color2.r;
			this.g = color1.g + color2.g;
			this.b = color1.b + color2.b;

			return this;

		}

		addScalar( s ) {

			this.r += s;
			this.g += s;
			this.b += s;

			return this;

		}

		sub( color ) {

			this.r = Math.max( 0, this.r - color.r );
			this.g = Math.max( 0, this.g - color.g );
			this.b = Math.max( 0, this.b - color.b );

			return this;

		}

		multiply( color ) {

			this.r *= color.r;
			this.g *= color.g;
			this.b *= color.b;

			return this;

		}

		multiplyScalar( s ) {

			this.r *= s;
			this.g *= s;
			this.b *= s;

			return this;

		}

		lerp( color, alpha ) {

			this.r += ( color.r - this.r ) * alpha;
			this.g += ( color.g - this.g ) * alpha;
			this.b += ( color.b - this.b ) * alpha;

			return this;

		}

		lerpColors( color1, color2, alpha ) {

			this.r = color1.r + ( color2.r - color1.r ) * alpha;
			this.g = color1.g + ( color2.g - color1.g ) * alpha;
			this.b = color1.b + ( color2.b - color1.b ) * alpha;

			return this;

		}

		lerpHSL( color, alpha ) {

			this.getHSL( _hslA );
			color.getHSL( _hslB );

			const h = lerp( _hslA.h, _hslB.h, alpha );
			const s = lerp( _hslA.s, _hslB.s, alpha );
			const l = lerp( _hslA.l, _hslB.l, alpha );

			this.setHSL( h, s, l );

			return this;

		}

		setFromVector3( v ) {

			this.r = v.x;
			this.g = v.y;
			this.b = v.z;

			return this;

		}

		applyMatrix3( m ) {

			const r = this.r, g = this.g, b = this.b;
			const e = m.elements;

			this.r = e[ 0 ] * r + e[ 3 ] * g + e[ 6 ] * b;
			this.g = e[ 1 ] * r + e[ 4 ] * g + e[ 7 ] * b;
			this.b = e[ 2 ] * r + e[ 5 ] * g + e[ 8 ] * b;

			return this;

		}

		equals( c ) {

			return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );

		}

		fromArray( array, offset = 0 ) {

			this.r = array[ offset ];
			this.g = array[ offset + 1 ];
			this.b = array[ offset + 2 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.r;
			array[ offset + 1 ] = this.g;
			array[ offset + 2 ] = this.b;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this.r = attribute.getX( index );
			this.g = attribute.getY( index );
			this.b = attribute.getZ( index );

			return this;

		}

		toJSON() {

			return this.getHex();

		}

		*[ Symbol.iterator ]() {

			yield this.r;
			yield this.g;
			yield this.b;

		}

	}

	const _color = /*@__PURE__*/ new Color();

	Color.NAMES = _colorKeywords;

	if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

		__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'register', { detail: {
			revision: REVISION,
		} } ) );

	}

	if ( typeof window !== 'undefined' ) {

		if ( window.__THREE__ ) {

			console.warn( 'WARNING: Multiple instances of Three.js being imported.' );

		} else {

			window.__THREE__ = REVISION;

		}

	}

	function errorIfZeroLength(v, msg = "Operação ilegal para vetor de tamanho 0") {
	    const lengthV = vectorLength(v);
	    if (lengthV === 0) {
	        throw new Error(msg);
	    }
	}
	function errorIfPointsColinear3(p1, p2, p3) {
	    const a = p1.sub(p2);
	    const b = p3.sub(p2);
	    const cross = crossProduct(a, b);
	    errorIfZeroLength(cross, `Operação ilegal: pontos colinerares; (${p1}; ${p2}; ${p3})`);
	}

	new Vector3(0, 0, 0);

	// src: https://lexrent.eu/wp-content/uploads/torza/artikel_groep_sub_2_docs/BYZ_3_Polygon-Area-and-Centroid.pdf
	// paul boorke
	function calculateCentroidZeroZ(vertices) {
	    let centroidX = 0;
	    let centroidY = 0;
	    let signedArea = 0;
	    const n = vertices.length;
	    for (let i = 0; i < n; i++) {
	        const x0 = vertices[i].x;
	        const y0 = vertices[i].y;
	        const x1 = vertices[(i + 1) % n].x;
	        const y1 = vertices[(i + 1) % n].y;
	        const cross = (x0 * y1) - (x1 * y0);
	        signedArea += cross;
	        centroidX += (x0 + x1) * cross;
	        centroidY += (y0 + y1) * cross;
	    }
	    signedArea *= 0.5;
	    centroidX /= 6 * signedArea;
	    centroidY /= 6 * signedArea;
	    return new Point3(centroidX, centroidY, 0);
	}
	function centroidFromPoints(...points) {
	    const centroid = new Point3(0, 0, 0);
	    points.forEach((point) => {
	        centroid.x += point.x;
	        centroid.y += point.y;
	        centroid.z += point.z;
	    });
	    const numberOfPoints = points.length;
	    if (numberOfPoints > 0) {
	        centroid.x /= numberOfPoints;
	        centroid.y /= numberOfPoints;
	        centroid.z /= numberOfPoints;
	    }
	    return centroid;
	}
	function sortConvexPointsCCW(points) {
	    let ret = [];
	    if (points.length > 0 && arePointsCoplanar(points)) {
	        const centroid = centroidFromPoints(...points);
	        ret = points.slice().sort((a, b) => {
	            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
	            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
	            let cmp = angleB - angleA;
	            return cmp;
	        });
	    }
	    return ret;
	}
	function arePointsCollinear(points) {
	    if (points.length < 3)
	        return true; // Any two points are always collinear
	    let baseVector = null;
	    // Find the first non-zero baseVector by iterating through the points
	    for (let i = 1; i < points.length; i++) {
	        baseVector = points[i].sub(points[0]);
	        if (baseVector.length() > TOLERANCE_EPSILON) {
	            break; // Found a valid base vector
	        }
	    }
	    // If we don't find a valid baseVector, it means all points are the same
	    if (!baseVector || baseVector.length() <= TOLERANCE_EPSILON) {
	        return true; // All points are coincident, trivially collinear
	    }
	    // Now check the rest of the points using the found baseVector
	    for (let i = 2; i < points.length; i++) {
	        const currentVector = points[i].sub(points[0]);
	        const crossProductInt = crossProduct(baseVector, currentVector);
	        // Check if the cross product is close to zero (meaning points are collinear)
	        if (crossProductInt.length() > TOLERANCE_EPSILON) {
	            return false; // Found a non-zero cross product, points are not collinear
	        }
	    }
	    return true; // All cross products are zero, points are collinear
	}
	function arePointsCoplanar(points) {
	    if (points.length < 4)
	        return true; // Any three points are always coplanar
	    const baseVector1 = points[1].sub(points[0]);
	    const baseVector2 = points[2].sub(points[0]);
	    const normal = baseVector1.cross(baseVector2);
	    for (let i = 3; i < points.length; i++) {
	        const currentVector = points[i].sub(points[0]);
	        const dotProduct = normal.dot(currentVector);
	        if (dotProduct !== 0) {
	            return false; // Found a non-zero dot product, points are not coplanar
	        }
	    }
	    return true; // All dot products are zero, points are coplanar
	}

	const TOLERANCE_EPSILON = 1e-14;
	class Point3 {
	    x = 0;
	    y = 0;
	    z = 0;
	    // theta(1)
	    constructor(x = 0, y = 0, z = 0) {
	        this.x = x;
	        this.y = y;
	        this.z = z;
	    }
	    // theta(1)
	    toVector3 = () => new Vector3(this.x, this.y, this.z);
	    // theta(1)
	    clone = () => new Point3(this.x, this.y, this.z);
	    // theta(1)
	    equals(p) {
	        return this.x === p.x && this.y === p.y && this.z === p.z;
	    }
	    set(p) {
	        this.x = p.x;
	        this.y = p.y;
	        this.z = p.z;
	    }
	    // theta(1)
	    sub(p) {
	        return this.toVector3().sub(p);
	    }
	    // theta(1)
	    add(p) {
	        return this.toVector3().add(p);
	    }
	    // theta(1)
	    distanceTo(p) {
	        const v = this.sub(p);
	        return v.length();
	    }
	    // theta(1)
	    distanceToSq(p) {
	        const v = this.sub(p);
	        return v.lengthSq();
	    }
	    // theta(1)
	    medianPointTo(p, median = 0.5) {
	        return Point3.fromVector3(this.toVector3().add(p.toVector3().sub(this).multiplyScalar(median)));
	    }
	    // helper
	    cross(other) {
	        return new Point3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
	    }
	    // helper    
	    isZero() {
	        return this.x === 0 && this.y === 0 && this.z === 0;
	    }
	    // theta(n)
	    static centroid(points) {
	        const n = points.length;
	        const sum = points.reduce((acc, point) => {
	            acc.x += point.x;
	            acc.y += point.y;
	            acc.z += point.z;
	            return acc;
	        }, { x: 0, y: 0, z: 0 });
	        return new Point3(sum.x / n, sum.y / n, sum.z / n);
	    }
	    // helper
	    dot(other) {
	        return this.x * other.x + this.y * other.y + this.z * other.z;
	    }
	    static fromVector3 = (v) => new Point3(v.x, v.y, v.z);
	    toString = (precision = 2) => `(${this.x.toFixed(precision)},${this.y.toFixed(precision)},${this.z.toFixed(precision)})`;
	    static lerp(p0, p1, t) {
	        if (t < 0 || t > 1) {
	            throw new Error("Parameter t outside range 0 to 1 (inclusives)");
	        }
	        return new Point3(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t, p0.z + (p1.z - p0.z) * t);
	    }
	    isBetween = (a, b) => {
	        if (!arePointsCollinear([this, a, b])) {
	            return false;
	        }
	        const withinXBounds = Math.min(a.x, b.x) <= this.x && this.x <= Math.max(a.x, b.x);
	        const withinYBounds = Math.min(a.y, b.y) <= this.y && this.y <= Math.max(a.y, b.y);
	        return withinXBounds && withinYBounds;
	    };
	}
	var PointGenerationType;
	(function (PointGenerationType) {
	    PointGenerationType["RANDOM_BRUTE_FORCE"] = "Random brute force";
	    PointGenerationType["STRATIFIED_SAMPLING"] = "Stratified sampling";
	})(PointGenerationType || (PointGenerationType = {}));

	// theta(1)
	function scaleVector(v1, n) {
	    let ret = v1.clone();
	    ret.x *= n;
	    ret.y *= n;
	    ret.z *= n;
	    return ret;
	}
	// theta(1)
	function multiplyPointByScalar(v1, n) {
	    let ret = v1.clone();
	    ret.x *= n;
	    ret.y *= n;
	    ret.z *= n;
	    return ret;
	}
	// theta(1)
	// a rigor, tinha que ser o somatorio da multiplicação de todas as coordenadas em cada dimensão
	// também tinha que estar em euler.ts por semantica, mas para nao gerar dependencia ciclica fica aqui
	function dotProduct(v1, v2) {
	    return (v1.x * v2.x) + (v1.y * v2.y) + (v1.z * v2.z);
	}
	// theta(1)
	function crossProduct(v1, v2) {
	    const cross_x = v1.y * v2.z - v1.z * v2.y;
	    const cross_y = v1.z * v2.x - v1.x * v2.z;
	    const cross_z = v1.x * v2.y - v1.y * v2.x;
	    return new Vector3(cross_x, cross_y, cross_z);
	}
	// theta(1)
	function addVectors(v1, v2) {
	    return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
	}
	// coordenadas homogenas serao implementadas, se necessario, via shaders
	// no alto nivel temos classes THREE.Vector3 para vetores e uso nas renderizacoes e nossa propria classe Point3 para calculos envolvendo pontos
	var OrientationCase;
	(function (OrientationCase) {
	    OrientationCase[OrientationCase["COLINEAR"] = 0] = "COLINEAR";
	    OrientationCase[OrientationCase["COUNTER_CLOCK_WISE"] = 1] = "COUNTER_CLOCK_WISE";
	    OrientationCase[OrientationCase["CLOCK_WISE"] = -1] = "CLOCK_WISE";
	})(OrientationCase || (OrientationCase = {}));
	var CollinearOrderingCase;
	(function (CollinearOrderingCase) {
	    CollinearOrderingCase[CollinearOrderingCase["NOT_COLINEAR"] = 0] = "NOT_COLINEAR";
	    CollinearOrderingCase[CollinearOrderingCase["AFTER"] = 1] = "AFTER";
	    CollinearOrderingCase[CollinearOrderingCase["BEFORE"] = 2] = "BEFORE";
	    CollinearOrderingCase[CollinearOrderingCase["BETWEEN"] = 3] = "BETWEEN";
	})(CollinearOrderingCase || (CollinearOrderingCase = {}));
	// theta(1)
	function vectorLength(v) {
	    const dot = dotProduct(v, v);
	    return Math.sqrt(dot);
	}

	class Rectangle {
	    x;
	    y;
	    width;
	    height;
	    constructor(x, // Center x
	    y, // Center y
	    width, // Half width
	    height // Half height
	    ) {
	        this.x = x;
	        this.y = y;
	        this.width = width;
	        this.height = height;
	    }
	    // Check if a point is within this rectangle
	    contains(point) {
	        return (point.x >= this.x - this.width &&
	            point.x <= this.x + this.width &&
	            point.y >= this.y - this.height &&
	            point.y <= this.y + this.height);
	    }
	    // Check if this rectangle intersects with another rectangle
	    intersects(other) {
	        return !(other.x - other.width > this.x + this.width ||
	            other.x + other.width < this.x - this.width ||
	            other.y - other.height > this.y + this.height ||
	            other.y + other.height < this.y - this.height);
	    }
	    // Check if this rectangle intersects with a BoundingBox2d
	    intersectsBoundingBox(bbox) {
	        const rectMinX = this.x - this.width;
	        const rectMaxX = this.x + this.width;
	        const rectMinY = this.y - this.height;
	        const rectMaxY = this.y + this.height;
	        return !(bbox.minX > rectMaxX ||
	            bbox.maxX < rectMinX ||
	            bbox.minY > rectMaxY ||
	            bbox.maxY < rectMinY);
	    }
	}

	function calcCircumcircle(p1, p2, p3) {
	    errorIfPointsColinear3(p1, p2, p3);
	    const mid1 = new Point3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
	    const mid2 = new Point3((p2.x + p3.x) / 2, (p2.y + p3.y) / 2, (p2.z + p3.z) / 2);
	    const dir1 = p2.sub(p1);
	    const dir2 = p3.sub(p2);
	    const normal = crossProduct(dir1, dir2);
	    const bisectorDir1 = crossProduct(dir1, normal);
	    const bisectorDir2 = crossProduct(dir2, normal);
	    const determinant = dotProduct(crossProduct(bisectorDir1, bisectorDir2), normal);
	    const t = dotProduct(crossProduct(mid2.sub(mid1), bisectorDir2), normal) / determinant;
	    const center = addVectors(mid1.toVector3(), scaleVector(bisectorDir1, t));
	    const radius = center.distanceTo(p1);
	    return { origin: Point3.fromVector3(center), radius };
	}

	class BoundingBox2d {
	    minX;
	    minY;
	    maxX;
	    maxY;
	    constructor(minX = 0, minY = 0, maxX = 0, maxY = 0) {
	        this.minX = minX;
	        this.minY = minY;
	        this.maxX = maxX;
	        this.maxY = maxY;
	    }
	}
	class PolygonEdge {
	    start = new Point3();
	    end = new Point3();
	    isEqual(other) {
	        return (other.start.equals(this.start) && other.end.equals(this.end)) ||
	            (other.start.equals(this.end) && other.end.equals(this.start));
	    }
	    equals(other) {
	        return this.isEqual(other);
	    }
	    constructor(start = new Point3(), end = new Point3()) {
	        this.start = start;
	        this.end = end;
	    }
	    connectsTo(possibility) {
	        let ret = null;
	        if (this.start.equals(possibility)) {
	            ret = this.end;
	        }
	        if (this.end.equals(possibility)) {
	            ret = this.start;
	        }
	        return ret;
	    }
	}
	let POLYGON_SEQUENCE = 0;
	class PolygonShape {
	    id = ++POLYGON_SEQUENCE;
	    points = [];
	    constructor(points) {
	        this.points = points;
	    }
	    sharesEdgeWith(other) {
	        const thisEdges = this.getEdges();
	        const otherEdges = other.getEdges();
	        for (const thisEdge of thisEdges) {
	            for (const otherEdge of otherEdges) {
	                if (thisEdge.isEqual(otherEdge)) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    }
	    getEdgeIndex(edge) {
	        let ret = -1;
	        if (edge && this.points.length > 1) {
	            for (let i = 0; i < this.points.length; i++) {
	                let nextIndex = (i + 1) % this.points.length;
	                let polygonEdge = new PolygonEdge(this.points[i], this.points[nextIndex]);
	                if (edge.isEqual(polygonEdge)) {
	                    ret = i;
	                    break;
	                }
	            }
	        }
	        return ret;
	    }
	    isPointInside(x, y) {
	        let inside = false;
	        const polygon = this.points;
	        const n = this.points.length;
	        for (let i = 0, j = n - 1; i < n; j = i++) {
	            const xi = polygon[i].x, yi = polygon[i].y;
	            const xj = polygon[j].x, yj = polygon[j].y;
	            const intersect = ((yi > y) !== (yj > y)) &&
	                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
	            if (intersect)
	                inside = !inside;
	        }
	        return inside;
	    }
	    getBoundingBox() {
	        const xs = this.points.map(point => point.x);
	        const ys = this.points.map(point => point.y);
	        return {
	            minX: Math.min(...xs),
	            maxX: Math.max(...xs),
	            minY: Math.min(...ys),
	            maxY: Math.max(...ys)
	        };
	    }
	}

	/**
	 * Rearranges items so that all items in the [left, k] are the smallest.
	 * The k-th element will have the (k - left + 1)-th smallest value in [left, right].
	 *
	 * @template T
	 * @param {T[]} arr the array to partially sort (in place)
	 * @param {number} k middle index for partial sorting (as defined above)
	 * @param {number} [left=0] left index of the range to sort
	 * @param {number} [right=arr.length-1] right index
	 * @param {(a: T, b: T) => number} [compare = (a, b) => a - b] compare function
	 */
	function quickselect(arr, k, left = 0, right = arr.length - 1, compare = defaultCompare) {

	    while (right > left) {
	        if (right - left > 600) {
	            const n = right - left + 1;
	            const m = k - left + 1;
	            const z = Math.log(n);
	            const s = 0.5 * Math.exp(2 * z / 3);
	            const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
	            const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
	            const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
	            quickselect(arr, k, newLeft, newRight, compare);
	        }

	        const t = arr[k];
	        let i = left;
	        /** @type {number} */
	        let j = right;

	        swap$1(arr, left, k);
	        if (compare(arr[right], t) > 0) swap$1(arr, left, right);

	        while (i < j) {
	            swap$1(arr, i, j);
	            i++;
	            j--;
	            while (compare(arr[i], t) < 0) i++;
	            while (compare(arr[j], t) > 0) j--;
	        }

	        if (compare(arr[left], t) === 0) swap$1(arr, left, j);
	        else {
	            j++;
	            swap$1(arr, j, right);
	        }

	        if (j <= k) left = j + 1;
	        if (k <= j) right = j - 1;
	    }
	}

	/**
	 * @template T
	 * @param {T[]} arr
	 * @param {number} i
	 * @param {number} j
	 */
	function swap$1(arr, i, j) {
	    const tmp = arr[i];
	    arr[i] = arr[j];
	    arr[j] = tmp;
	}

	/**
	 * @template T
	 * @param {T} a
	 * @param {T} b
	 * @returns {number}
	 */
	function defaultCompare(a, b) {
	    return a < b ? -1 : a > b ? 1 : 0;
	}

	class RBush {
	    constructor(maxEntries = 9) {
	        // max entries in a node is 9 by default; min node fill is 40% for best performance
	        this._maxEntries = Math.max(4, maxEntries);
	        this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
	        this.clear();
	    }

	    all() {
	        return this._all(this.data, []);
	    }

	    search(bbox) {
	        let node = this.data;
	        const result = [];

	        if (!intersects(bbox, node)) return result;

	        const toBBox = this.toBBox;
	        const nodesToSearch = [];

	        while (node) {
	            for (let i = 0; i < node.children.length; i++) {
	                const child = node.children[i];
	                const childBBox = node.leaf ? toBBox(child) : child;

	                if (intersects(bbox, childBBox)) {
	                    if (node.leaf) result.push(child);
	                    else if (contains(bbox, childBBox)) this._all(child, result);
	                    else nodesToSearch.push(child);
	                }
	            }
	            node = nodesToSearch.pop();
	        }

	        return result;
	    }

	    collides(bbox) {
	        let node = this.data;

	        if (!intersects(bbox, node)) return false;

	        const nodesToSearch = [];
	        while (node) {
	            for (let i = 0; i < node.children.length; i++) {
	                const child = node.children[i];
	                const childBBox = node.leaf ? this.toBBox(child) : child;

	                if (intersects(bbox, childBBox)) {
	                    if (node.leaf || contains(bbox, childBBox)) return true;
	                    nodesToSearch.push(child);
	                }
	            }
	            node = nodesToSearch.pop();
	        }

	        return false;
	    }

	    load(data) {
	        if (!(data && data.length)) return this;

	        if (data.length < this._minEntries) {
	            for (let i = 0; i < data.length; i++) {
	                this.insert(data[i]);
	            }
	            return this;
	        }

	        // recursively build the tree with the given data from scratch using OMT algorithm
	        let node = this._build(data.slice(), 0, data.length - 1, 0);

	        if (!this.data.children.length) {
	            // save as is if tree is empty
	            this.data = node;

	        } else if (this.data.height === node.height) {
	            // split root if trees have the same height
	            this._splitRoot(this.data, node);

	        } else {
	            if (this.data.height < node.height) {
	                // swap trees if inserted one is bigger
	                const tmpNode = this.data;
	                this.data = node;
	                node = tmpNode;
	            }

	            // insert the small tree into the large tree at appropriate level
	            this._insert(node, this.data.height - node.height - 1, true);
	        }

	        return this;
	    }

	    insert(item) {
	        if (item) this._insert(item, this.data.height - 1);
	        return this;
	    }

	    clear() {
	        this.data = createNode([]);
	        return this;
	    }

	    remove(item, equalsFn) {
	        if (!item) return this;

	        let node = this.data;
	        const bbox = this.toBBox(item);
	        const path = [];
	        const indexes = [];
	        let i, parent, goingUp;

	        // depth-first iterative tree traversal
	        while (node || path.length) {

	            if (!node) { // go up
	                node = path.pop();
	                parent = path[path.length - 1];
	                i = indexes.pop();
	                goingUp = true;
	            }

	            if (node.leaf) { // check current node
	                const index = findItem(item, node.children, equalsFn);

	                if (index !== -1) {
	                    // item found, remove the item and condense tree upwards
	                    node.children.splice(index, 1);
	                    path.push(node);
	                    this._condense(path);
	                    return this;
	                }
	            }

	            if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
	                path.push(node);
	                indexes.push(i);
	                i = 0;
	                parent = node;
	                node = node.children[0];

	            } else if (parent) { // go right
	                i++;
	                node = parent.children[i];
	                goingUp = false;

	            } else node = null; // nothing found
	        }

	        return this;
	    }

	    toBBox(item) { return item; }

	    compareMinX(a, b) { return a.minX - b.minX; }
	    compareMinY(a, b) { return a.minY - b.minY; }

	    toJSON() { return this.data; }

	    fromJSON(data) {
	        this.data = data;
	        return this;
	    }

	    _all(node, result) {
	        const nodesToSearch = [];
	        while (node) {
	            if (node.leaf) result.push(...node.children);
	            else nodesToSearch.push(...node.children);

	            node = nodesToSearch.pop();
	        }
	        return result;
	    }

	    _build(items, left, right, height) {

	        const N = right - left + 1;
	        let M = this._maxEntries;
	        let node;

	        if (N <= M) {
	            // reached leaf level; return leaf
	            node = createNode(items.slice(left, right + 1));
	            calcBBox(node, this.toBBox);
	            return node;
	        }

	        if (!height) {
	            // target height of the bulk-loaded tree
	            height = Math.ceil(Math.log(N) / Math.log(M));

	            // target number of root entries to maximize storage utilization
	            M = Math.ceil(N / Math.pow(M, height - 1));
	        }

	        node = createNode([]);
	        node.leaf = false;
	        node.height = height;

	        // split the items into M mostly square tiles

	        const N2 = Math.ceil(N / M);
	        const N1 = N2 * Math.ceil(Math.sqrt(M));

	        multiSelect(items, left, right, N1, this.compareMinX);

	        for (let i = left; i <= right; i += N1) {

	            const right2 = Math.min(i + N1 - 1, right);

	            multiSelect(items, i, right2, N2, this.compareMinY);

	            for (let j = i; j <= right2; j += N2) {

	                const right3 = Math.min(j + N2 - 1, right2);

	                // pack each entry recursively
	                node.children.push(this._build(items, j, right3, height - 1));
	            }
	        }

	        calcBBox(node, this.toBBox);

	        return node;
	    }

	    _chooseSubtree(bbox, node, level, path) {
	        while (true) {
	            path.push(node);

	            if (node.leaf || path.length - 1 === level) break;

	            let minArea = Infinity;
	            let minEnlargement = Infinity;
	            let targetNode;

	            for (let i = 0; i < node.children.length; i++) {
	                const child = node.children[i];
	                const area = bboxArea(child);
	                const enlargement = enlargedArea(bbox, child) - area;

	                // choose entry with the least area enlargement
	                if (enlargement < minEnlargement) {
	                    minEnlargement = enlargement;
	                    minArea = area < minArea ? area : minArea;
	                    targetNode = child;

	                } else if (enlargement === minEnlargement) {
	                    // otherwise choose one with the smallest area
	                    if (area < minArea) {
	                        minArea = area;
	                        targetNode = child;
	                    }
	                }
	            }

	            node = targetNode || node.children[0];
	        }

	        return node;
	    }

	    _insert(item, level, isNode) {
	        const bbox = isNode ? item : this.toBBox(item);
	        const insertPath = [];

	        // find the best node for accommodating the item, saving all nodes along the path too
	        const node = this._chooseSubtree(bbox, this.data, level, insertPath);

	        // put the item into the node
	        node.children.push(item);
	        extend(node, bbox);

	        // split on node overflow; propagate upwards if necessary
	        while (level >= 0) {
	            if (insertPath[level].children.length > this._maxEntries) {
	                this._split(insertPath, level);
	                level--;
	            } else break;
	        }

	        // adjust bboxes along the insertion path
	        this._adjustParentBBoxes(bbox, insertPath, level);
	    }

	    // split overflowed node into two
	    _split(insertPath, level) {
	        const node = insertPath[level];
	        const M = node.children.length;
	        const m = this._minEntries;

	        this._chooseSplitAxis(node, m, M);

	        const splitIndex = this._chooseSplitIndex(node, m, M);

	        const newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
	        newNode.height = node.height;
	        newNode.leaf = node.leaf;

	        calcBBox(node, this.toBBox);
	        calcBBox(newNode, this.toBBox);

	        if (level) insertPath[level - 1].children.push(newNode);
	        else this._splitRoot(node, newNode);
	    }

	    _splitRoot(node, newNode) {
	        // split root node
	        this.data = createNode([node, newNode]);
	        this.data.height = node.height + 1;
	        this.data.leaf = false;
	        calcBBox(this.data, this.toBBox);
	    }

	    _chooseSplitIndex(node, m, M) {
	        let index;
	        let minOverlap = Infinity;
	        let minArea = Infinity;

	        for (let i = m; i <= M - m; i++) {
	            const bbox1 = distBBox(node, 0, i, this.toBBox);
	            const bbox2 = distBBox(node, i, M, this.toBBox);

	            const overlap = intersectionArea(bbox1, bbox2);
	            const area = bboxArea(bbox1) + bboxArea(bbox2);

	            // choose distribution with minimum overlap
	            if (overlap < minOverlap) {
	                minOverlap = overlap;
	                index = i;

	                minArea = area < minArea ? area : minArea;

	            } else if (overlap === minOverlap) {
	                // otherwise choose distribution with minimum area
	                if (area < minArea) {
	                    minArea = area;
	                    index = i;
	                }
	            }
	        }

	        return index || M - m;
	    }

	    // sorts node children by the best axis for split
	    _chooseSplitAxis(node, m, M) {
	        const compareMinX = node.leaf ? this.compareMinX : compareNodeMinX;
	        const compareMinY = node.leaf ? this.compareMinY : compareNodeMinY;
	        const xMargin = this._allDistMargin(node, m, M, compareMinX);
	        const yMargin = this._allDistMargin(node, m, M, compareMinY);

	        // if total distributions margin value is minimal for x, sort by minX,
	        // otherwise it's already sorted by minY
	        if (xMargin < yMargin) node.children.sort(compareMinX);
	    }

	    // total margin of all possible split distributions where each node is at least m full
	    _allDistMargin(node, m, M, compare) {
	        node.children.sort(compare);

	        const toBBox = this.toBBox;
	        const leftBBox = distBBox(node, 0, m, toBBox);
	        const rightBBox = distBBox(node, M - m, M, toBBox);
	        let margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);

	        for (let i = m; i < M - m; i++) {
	            const child = node.children[i];
	            extend(leftBBox, node.leaf ? toBBox(child) : child);
	            margin += bboxMargin(leftBBox);
	        }

	        for (let i = M - m - 1; i >= m; i--) {
	            const child = node.children[i];
	            extend(rightBBox, node.leaf ? toBBox(child) : child);
	            margin += bboxMargin(rightBBox);
	        }

	        return margin;
	    }

	    _adjustParentBBoxes(bbox, path, level) {
	        // adjust bboxes along the given tree path
	        for (let i = level; i >= 0; i--) {
	            extend(path[i], bbox);
	        }
	    }

	    _condense(path) {
	        // go through the path, removing empty nodes and updating bboxes
	        for (let i = path.length - 1, siblings; i >= 0; i--) {
	            if (path[i].children.length === 0) {
	                if (i > 0) {
	                    siblings = path[i - 1].children;
	                    siblings.splice(siblings.indexOf(path[i]), 1);

	                } else this.clear();

	            } else calcBBox(path[i], this.toBBox);
	        }
	    }
	}

	function findItem(item, items, equalsFn) {
	    if (!equalsFn) return items.indexOf(item);

	    for (let i = 0; i < items.length; i++) {
	        if (equalsFn(item, items[i])) return i;
	    }
	    return -1;
	}

	// calculate node's bbox from bboxes of its children
	function calcBBox(node, toBBox) {
	    distBBox(node, 0, node.children.length, toBBox, node);
	}

	// min bounding rectangle of node children from k to p-1
	function distBBox(node, k, p, toBBox, destNode) {
	    if (!destNode) destNode = createNode(null);
	    destNode.minX = Infinity;
	    destNode.minY = Infinity;
	    destNode.maxX = -Infinity;
	    destNode.maxY = -Infinity;

	    for (let i = k; i < p; i++) {
	        const child = node.children[i];
	        extend(destNode, node.leaf ? toBBox(child) : child);
	    }

	    return destNode;
	}

	function extend(a, b) {
	    a.minX = Math.min(a.minX, b.minX);
	    a.minY = Math.min(a.minY, b.minY);
	    a.maxX = Math.max(a.maxX, b.maxX);
	    a.maxY = Math.max(a.maxY, b.maxY);
	    return a;
	}

	function compareNodeMinX(a, b) { return a.minX - b.minX; }
	function compareNodeMinY(a, b) { return a.minY - b.minY; }

	function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
	function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

	function enlargedArea(a, b) {
	    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
	           (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
	}

	function intersectionArea(a, b) {
	    const minX = Math.max(a.minX, b.minX);
	    const minY = Math.max(a.minY, b.minY);
	    const maxX = Math.min(a.maxX, b.maxX);
	    const maxY = Math.min(a.maxY, b.maxY);

	    return Math.max(0, maxX - minX) *
	           Math.max(0, maxY - minY);
	}

	function contains(a, b) {
	    return a.minX <= b.minX &&
	           a.minY <= b.minY &&
	           b.maxX <= a.maxX &&
	           b.maxY <= a.maxY;
	}

	function intersects(a, b) {
	    return b.minX <= a.maxX &&
	           b.minY <= a.maxY &&
	           b.maxX >= a.minX &&
	           b.maxY >= a.minY;
	}

	function createNode(children) {
	    return {
	        children,
	        height: 1,
	        leaf: true,
	        minX: Infinity,
	        minY: Infinity,
	        maxX: -Infinity,
	        maxY: -Infinity
	    };
	}

	// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
	// combines selection algorithm with binary divide & conquer approach

	function multiSelect(arr, left, right, n, compare) {
	    const stack = [left, right];

	    while (stack.length) {
	        right = stack.pop();
	        left = stack.pop();

	        if (right - left <= n) continue;

	        const mid = left + Math.ceil((right - left) / n / 2) * n;
	        quickselect(arr, mid, left, right, compare);

	        stack.push(left, mid, mid, right);
	    }
	}

	let ID_SEQUENCE = 0;
	class HalfEdge {
	    id;
	    next = null;
	    twin = null;
	    vertex;
	    node;
	    constructor(vertex, parentNode) {
	        this.vertex = vertex;
	        this.node = parentNode;
	        this.id = ++ID_SEQUENCE;
	    }
	    getIndex() {
	        let ret = -1;
	        if (this.next) {
	            const pe = new PolygonEdge(this.vertex, this.next.vertex);
	            ret = this.node.shape.getEdgeIndex(pe);
	        }
	        return ret;
	    }
	    findNextWithout(...notToBePoints) {
	        let ref = this;
	        let found = this;
	        do {
	            if (ref && !notToBePoints.some(p => p.equals(ref.vertex))) {
	                found = ref;
	                break;
	            }
	            if (!ref.next) {
	                console.warn(`Error: no next halfedge detected! The shape is wrong...`);
	                break;
	            }
	            ref = ref.next;
	        } while (ref !== this);
	        return found;
	    }
	    findNextWith(...toBePoints) {
	        let ref = this;
	        let found = this;
	        do {
	            if (ref && toBePoints.some(p => p.equals(ref.vertex))) {
	                found = ref;
	                break;
	            }
	            if (!ref.next) {
	                console.warn(`Error: no next halfedge detected! The shape is wrong...`);
	                break;
	            }
	            ref = ref.next;
	        } while (ref !== this);
	        return found;
	    }
	}
	class HalfEdgeForDualGraph extends HalfEdge {
	    parentGraph;
	    constructor(parentGraph, vertex, parentNode) {
	        super(vertex, parentNode);
	        this.parentGraph = parentGraph;
	    }
	}
	class DualGraphNode {
	    shape;
	    center = new Point3();
	    firstHalfEdge;
	    parentGraph;
	    constructor(parentGraph, shape) {
	        this.parentGraph = parentGraph;
	        this.shape = shape;
	        this.center = Point3.centroid([...shape.points]);
	        this.firstHalfEdge = this.buildHalfEdges();
	    }
	    connect(node) {
	        let ret = false;
	        if (this.shape.sharesEdgeWith(node.shape)) {
	            this.linkHalfEdges(node);
	            ret = true;
	        }
	        return ret;
	    }
	    buildHalfEdges() {
	        const points = [...this.shape.points];
	        let firstEdge = null;
	        let prevEdge = null;
	        // todo: throw error if points.length === 0
	        for (let i = 0; i < points.length; i++) {
	            const edge = new HalfEdgeForDualGraph(this.parentGraph, points[i], this);
	            if (prevEdge) {
	                prevEdge.next = edge;
	            }
	            if (!firstEdge) {
	                firstEdge = edge;
	            }
	            prevEdge = edge;
	        }
	        if (prevEdge && firstEdge) {
	            prevEdge.next = firstEdge;
	        }
	        return firstEdge;
	    }
	    linkHalfEdges(node) {
	        if (!this.firstHalfEdge || !node.firstHalfEdge)
	            return;
	        const thisEdges = this.getHalfEdges();
	        const otherEdges = node.getHalfEdges();
	        for (const thisEdge of thisEdges) {
	            for (const otherEdge of otherEdges) {
	                // check if thisedge is the beginning of otheredge or if thisedge is the end of otheredge
	                if (otherEdge.next && thisEdge.vertex.equals(otherEdge.next?.vertex) && thisEdge.next?.vertex.equals(otherEdge.vertex)) {
	                    thisEdge.twin = otherEdge;
	                    otherEdge.twin = thisEdge;
	                }
	            }
	        }
	    }
	    getHalfEdges() {
	        const edges = [];
	        let edge = this.firstHalfEdge;
	        do {
	            if (edge) {
	                edges.push(edge);
	                edge = edge.next;
	            }
	        } while (edge && edge !== this.firstHalfEdge);
	        return edges;
	    }
	    findHalfEdgeWithVertex(p) {
	        const hes = this.getHalfEdges();
	        const he = hes.find(x => x.vertex.equals(p));
	        if (!he) {
	            throw new Error(`Half-edge for point ${p.toString()} not found`);
	        }
	        return he;
	    }
	}
	const DEFAULT_RADIUS_SCALING = 1;
	class MyRBush extends RBush {
	    toBBox(a) { return a.getBoundingBox(); }
	    compareMinX(a, b) { return a.x - b.x; }
	    compareMinY(a, b) { return a.y - b.y; }
	}
	class DualGraph {
	    nodes = [];
	    shapes = [];
	    tree;
	    constructor(shapes, boundary = new Rectangle(0, 0, 1000, 1000), capacity = 4) {
	        this.tree = new MyRBush();
	        for (const t of shapes) {
	            this.addShape(t);
	        }
	    }
	    getShapes() {
	        const arr = Array.from(this.nodes);
	        return arr.map(x => x.shape);
	    }
	    getTraversalOrdered(startingIdx = 0) {
	        const visited = [];
	        const nodes = Array.from(this.nodes);
	        function recHelper(node) {
	            visited.push(node);
	            let edge = node.firstHalfEdge;
	            do {
	                if (edge.twin?.node && !visited.includes(edge.twin?.node)) {
	                    recHelper(edge.twin.node);
	                }
	                edge = edge.next;
	            } while (edge && edge !== node.firstHalfEdge);
	        }
	        if (nodes.length > startingIdx) {
	            recHelper(nodes[startingIdx]);
	        }
	        return visited;
	    }
	    addShape(shape) {
	        const node = new DualGraphNode(this, shape);
	        let i = 0;
	        let edges = shape.getEdges();
	        for (const n of this.nodes) {
	            if (n.connect(node) && ++i >= edges.length) {
	                break;
	            }
	        }
	        this.tree.insert(shape);
	        this.nodes.push(node);
	        this.shapes.push(shape);
	        return node;
	    }
	    clearInactiveQuadtreeShapes() {
	        this.tree.clear();
	    }
	    queryNearbyShapes(point, radiusScaling = DEFAULT_RADIUS_SCALING) {
	        const rangeSizeX = Math.abs(point.x * radiusScaling);
	        const rangeSizeY = Math.abs(point.y * radiusScaling);
	        const range = new BoundingBox2d(-rangeSizeX, -rangeSizeY, rangeSizeX, rangeSizeY);
	        return this.tree.search(range);
	    }
	    removeShape(shape) {
	        const shapeIdx = this.shapes.indexOf(shape);
	        if (shapeIdx !== -1) {
	            const node = this.nodes.find(node => node.shape === shape);
	            if (node) {
	                const nodeIdx = this.nodes.indexOf(node);
	                let edge = node.firstHalfEdge;
	                do {
	                    if (edge.twin) {
	                        edge.twin.twin = null;
	                    }
	                    edge = edge.next;
	                } while (edge && edge !== node.firstHalfEdge);
	                this.nodes.splice(nodeIdx, 1);
	                this.shapes.splice(shapeIdx, 1);
	                this.tree.remove(shape);
	            }
	        }
	    }
	    findNodeByShape(shape) {
	        let ret = this.nodes.find(n => n.shape === shape);
	        if (!ret) {
	            throw new Error(`Shape ${shape.id} not found in graph`);
	        }
	        return ret;
	    }
	}

	/**
	 * @preserve
	 * Fast, destructive implemetation of Liang-Barsky line clipping algorithm.
	 * It clips a 2D segment by a rectangle.
	 * @author Alexander Milevski <info@w8r.name>
	 * @license MIT
	 */
	const EPSILON$1 = 1e-6;
	const INSIDE = 1;
	const OUTSIDE = 0;
	function clipT(num, denom, c) {
	  const tE = c[0];
	  const tL = c[1];
	  if (Math.abs(denom) < EPSILON$1) return num < 0;
	  const t = num / denom;
	  if (denom > 0) {
	    if (t > tL) return 0;
	    if (t > tE) c[0] = t;
	  } else {
	    if (t < tE) return 0;
	    if (t < tL) c[1] = t;
	  }
	  return 1;
	}
	function clip(a, b, box, da, db) {
	  const x1 = a[0];
	  const y1 = a[1];
	  const x2 = b[0];
	  const y2 = b[1];
	  const dx = x2 - x1;
	  const dy = y2 - y1;
	  if (da === void 0 || db === void 0) {
	    da = a;
	    db = b;
	  } else {
	    da[0] = a[0];
	    da[1] = a[1];
	    db[0] = b[0];
	    db[1] = b[1];
	  }
	  if (Math.abs(dx) < EPSILON$1 && Math.abs(dy) < EPSILON$1 && x1 >= box[0] && x1 <= box[2] && y1 >= box[1] && y1 <= box[3]) {
	    return INSIDE;
	  }
	  const c = [0, 1];
	  if (clipT(box[0] - x1, dx, c) && clipT(x1 - box[2], -dx, c) && clipT(box[1] - y1, dy, c) && clipT(y1 - box[3], -dy, c)) {
	    const tE = c[0];
	    const tL = c[1];
	    if (tL < 1) {
	      db[0] = x1 + tL * dx;
	      db[1] = y1 + tL * dy;
	    }
	    if (tE > 0) {
	      da[0] += tE * dx;
	      da[1] += tE * dy;
	    }
	    return INSIDE;
	  }
	  return OUTSIDE;
	}

	const epsilon$1 = 1.1102230246251565e-16;
	const splitter = 134217729;
	const resulterrbound = (3 + 8 * epsilon$1) * epsilon$1;

	// fast_expansion_sum_zeroelim routine from oritinal code
	function sum(elen, e, flen, f, h) {
	    let Q, Qnew, hh, bvirt;
	    let enow = e[0];
	    let fnow = f[0];
	    let eindex = 0;
	    let findex = 0;
	    if ((fnow > enow) === (fnow > -enow)) {
	        Q = enow;
	        enow = e[++eindex];
	    } else {
	        Q = fnow;
	        fnow = f[++findex];
	    }
	    let hindex = 0;
	    if (eindex < elen && findex < flen) {
	        if ((fnow > enow) === (fnow > -enow)) {
	            Qnew = enow + Q;
	            hh = Q - (Qnew - enow);
	            enow = e[++eindex];
	        } else {
	            Qnew = fnow + Q;
	            hh = Q - (Qnew - fnow);
	            fnow = f[++findex];
	        }
	        Q = Qnew;
	        if (hh !== 0) {
	            h[hindex++] = hh;
	        }
	        while (eindex < elen && findex < flen) {
	            if ((fnow > enow) === (fnow > -enow)) {
	                Qnew = Q + enow;
	                bvirt = Qnew - Q;
	                hh = Q - (Qnew - bvirt) + (enow - bvirt);
	                enow = e[++eindex];
	            } else {
	                Qnew = Q + fnow;
	                bvirt = Qnew - Q;
	                hh = Q - (Qnew - bvirt) + (fnow - bvirt);
	                fnow = f[++findex];
	            }
	            Q = Qnew;
	            if (hh !== 0) {
	                h[hindex++] = hh;
	            }
	        }
	    }
	    while (eindex < elen) {
	        Qnew = Q + enow;
	        bvirt = Qnew - Q;
	        hh = Q - (Qnew - bvirt) + (enow - bvirt);
	        enow = e[++eindex];
	        Q = Qnew;
	        if (hh !== 0) {
	            h[hindex++] = hh;
	        }
	    }
	    while (findex < flen) {
	        Qnew = Q + fnow;
	        bvirt = Qnew - Q;
	        hh = Q - (Qnew - bvirt) + (fnow - bvirt);
	        fnow = f[++findex];
	        Q = Qnew;
	        if (hh !== 0) {
	            h[hindex++] = hh;
	        }
	    }
	    if (Q !== 0 || hindex === 0) {
	        h[hindex++] = Q;
	    }
	    return hindex;
	}

	function estimate(elen, e) {
	    let Q = e[0];
	    for (let i = 1; i < elen; i++) Q += e[i];
	    return Q;
	}

	function vec(n) {
	    return new Float64Array(n);
	}

	const ccwerrboundA = (3 + 16 * epsilon$1) * epsilon$1;
	const ccwerrboundB = (2 + 12 * epsilon$1) * epsilon$1;
	const ccwerrboundC = (9 + 64 * epsilon$1) * epsilon$1 * epsilon$1;

	const B = vec(4);
	const C1 = vec(8);
	const C2 = vec(12);
	const D = vec(16);
	const u = vec(4);

	function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
	    let acxtail, acytail, bcxtail, bcytail;
	    let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u3;

	    const acx = ax - cx;
	    const bcx = bx - cx;
	    const acy = ay - cy;
	    const bcy = by - cy;

	    s1 = acx * bcy;
	    c = splitter * acx;
	    ahi = c - (c - acx);
	    alo = acx - ahi;
	    c = splitter * bcy;
	    bhi = c - (c - bcy);
	    blo = bcy - bhi;
	    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
	    t1 = acy * bcx;
	    c = splitter * acy;
	    ahi = c - (c - acy);
	    alo = acy - ahi;
	    c = splitter * bcx;
	    bhi = c - (c - bcx);
	    blo = bcx - bhi;
	    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
	    _i = s0 - t0;
	    bvirt = s0 - _i;
	    B[0] = s0 - (_i + bvirt) + (bvirt - t0);
	    _j = s1 + _i;
	    bvirt = _j - s1;
	    _0 = s1 - (_j - bvirt) + (_i - bvirt);
	    _i = _0 - t1;
	    bvirt = _0 - _i;
	    B[1] = _0 - (_i + bvirt) + (bvirt - t1);
	    u3 = _j + _i;
	    bvirt = u3 - _j;
	    B[2] = _j - (u3 - bvirt) + (_i - bvirt);
	    B[3] = u3;

	    let det = estimate(4, B);
	    let errbound = ccwerrboundB * detsum;
	    if (det >= errbound || -det >= errbound) {
	        return det;
	    }

	    bvirt = ax - acx;
	    acxtail = ax - (acx + bvirt) + (bvirt - cx);
	    bvirt = bx - bcx;
	    bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
	    bvirt = ay - acy;
	    acytail = ay - (acy + bvirt) + (bvirt - cy);
	    bvirt = by - bcy;
	    bcytail = by - (bcy + bvirt) + (bvirt - cy);

	    if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
	        return det;
	    }

	    errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
	    det += (acx * bcytail + bcy * acxtail) - (acy * bcxtail + bcx * acytail);
	    if (det >= errbound || -det >= errbound) return det;

	    s1 = acxtail * bcy;
	    c = splitter * acxtail;
	    ahi = c - (c - acxtail);
	    alo = acxtail - ahi;
	    c = splitter * bcy;
	    bhi = c - (c - bcy);
	    blo = bcy - bhi;
	    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
	    t1 = acytail * bcx;
	    c = splitter * acytail;
	    ahi = c - (c - acytail);
	    alo = acytail - ahi;
	    c = splitter * bcx;
	    bhi = c - (c - bcx);
	    blo = bcx - bhi;
	    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
	    _i = s0 - t0;
	    bvirt = s0 - _i;
	    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
	    _j = s1 + _i;
	    bvirt = _j - s1;
	    _0 = s1 - (_j - bvirt) + (_i - bvirt);
	    _i = _0 - t1;
	    bvirt = _0 - _i;
	    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
	    u3 = _j + _i;
	    bvirt = u3 - _j;
	    u[2] = _j - (u3 - bvirt) + (_i - bvirt);
	    u[3] = u3;
	    const C1len = sum(4, B, 4, u, C1);

	    s1 = acx * bcytail;
	    c = splitter * acx;
	    ahi = c - (c - acx);
	    alo = acx - ahi;
	    c = splitter * bcytail;
	    bhi = c - (c - bcytail);
	    blo = bcytail - bhi;
	    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
	    t1 = acy * bcxtail;
	    c = splitter * acy;
	    ahi = c - (c - acy);
	    alo = acy - ahi;
	    c = splitter * bcxtail;
	    bhi = c - (c - bcxtail);
	    blo = bcxtail - bhi;
	    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
	    _i = s0 - t0;
	    bvirt = s0 - _i;
	    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
	    _j = s1 + _i;
	    bvirt = _j - s1;
	    _0 = s1 - (_j - bvirt) + (_i - bvirt);
	    _i = _0 - t1;
	    bvirt = _0 - _i;
	    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
	    u3 = _j + _i;
	    bvirt = u3 - _j;
	    u[2] = _j - (u3 - bvirt) + (_i - bvirt);
	    u[3] = u3;
	    const C2len = sum(C1len, C1, 4, u, C2);

	    s1 = acxtail * bcytail;
	    c = splitter * acxtail;
	    ahi = c - (c - acxtail);
	    alo = acxtail - ahi;
	    c = splitter * bcytail;
	    bhi = c - (c - bcytail);
	    blo = bcytail - bhi;
	    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
	    t1 = acytail * bcxtail;
	    c = splitter * acytail;
	    ahi = c - (c - acytail);
	    alo = acytail - ahi;
	    c = splitter * bcxtail;
	    bhi = c - (c - bcxtail);
	    blo = bcxtail - bhi;
	    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
	    _i = s0 - t0;
	    bvirt = s0 - _i;
	    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
	    _j = s1 + _i;
	    bvirt = _j - s1;
	    _0 = s1 - (_j - bvirt) + (_i - bvirt);
	    _i = _0 - t1;
	    bvirt = _0 - _i;
	    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
	    u3 = _j + _i;
	    bvirt = u3 - _j;
	    u[2] = _j - (u3 - bvirt) + (_i - bvirt);
	    u[3] = u3;
	    const Dlen = sum(C2len, C2, 4, u, D);

	    return D[Dlen - 1];
	}

	function orient2d(ax, ay, bx, by, cx, cy) {
	    const detleft = (ay - cy) * (bx - cx);
	    const detright = (ax - cx) * (by - cy);
	    const det = detleft - detright;

	    const detsum = Math.abs(detleft + detright);
	    if (Math.abs(det) >= ccwerrboundA * detsum) return det;

	    return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
	}

	const EPSILON = Math.pow(2, -52);
	const EDGE_STACK = new Uint32Array(512);

	class Delaunator {

	    static from(points, getX = defaultGetX, getY = defaultGetY) {
	        const n = points.length;
	        const coords = new Float64Array(n * 2);

	        for (let i = 0; i < n; i++) {
	            const p = points[i];
	            coords[2 * i] = getX(p);
	            coords[2 * i + 1] = getY(p);
	        }

	        return new Delaunator(coords);
	    }

	    constructor(coords) {
	        const n = coords.length >> 1;
	        if (n > 0 && typeof coords[0] !== 'number') throw new Error('Expected coords to contain numbers.');

	        this.coords = coords;

	        // arrays that will store the triangulation graph
	        const maxTriangles = Math.max(2 * n - 5, 0);
	        this._triangles = new Uint32Array(maxTriangles * 3);
	        this._halfedges = new Int32Array(maxTriangles * 3);

	        // temporary arrays for tracking the edges of the advancing convex hull
	        this._hashSize = Math.ceil(Math.sqrt(n));
	        this._hullPrev = new Uint32Array(n); // edge to prev edge
	        this._hullNext = new Uint32Array(n); // edge to next edge
	        this._hullTri = new Uint32Array(n); // edge to adjacent triangle
	        this._hullHash = new Int32Array(this._hashSize); // angular edge hash

	        // temporary arrays for sorting points
	        this._ids = new Uint32Array(n);
	        this._dists = new Float64Array(n);

	        this.update();
	    }

	    update() {
	        const {coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash} =  this;
	        const n = coords.length >> 1;

	        // populate an array of point indices; calculate input data bbox
	        let minX = Infinity;
	        let minY = Infinity;
	        let maxX = -Infinity;
	        let maxY = -Infinity;

	        for (let i = 0; i < n; i++) {
	            const x = coords[2 * i];
	            const y = coords[2 * i + 1];
	            if (x < minX) minX = x;
	            if (y < minY) minY = y;
	            if (x > maxX) maxX = x;
	            if (y > maxY) maxY = y;
	            this._ids[i] = i;
	        }
	        const cx = (minX + maxX) / 2;
	        const cy = (minY + maxY) / 2;

	        let i0, i1, i2;

	        // pick a seed point close to the center
	        for (let i = 0, minDist = Infinity; i < n; i++) {
	            const d = dist(cx, cy, coords[2 * i], coords[2 * i + 1]);
	            if (d < minDist) {
	                i0 = i;
	                minDist = d;
	            }
	        }
	        const i0x = coords[2 * i0];
	        const i0y = coords[2 * i0 + 1];

	        // find the point closest to the seed
	        for (let i = 0, minDist = Infinity; i < n; i++) {
	            if (i === i0) continue;
	            const d = dist(i0x, i0y, coords[2 * i], coords[2 * i + 1]);
	            if (d < minDist && d > 0) {
	                i1 = i;
	                minDist = d;
	            }
	        }
	        let i1x = coords[2 * i1];
	        let i1y = coords[2 * i1 + 1];

	        let minRadius = Infinity;

	        // find the third point which forms the smallest circumcircle with the first two
	        for (let i = 0; i < n; i++) {
	            if (i === i0 || i === i1) continue;
	            const r = circumradius(i0x, i0y, i1x, i1y, coords[2 * i], coords[2 * i + 1]);
	            if (r < minRadius) {
	                i2 = i;
	                minRadius = r;
	            }
	        }
	        let i2x = coords[2 * i2];
	        let i2y = coords[2 * i2 + 1];

	        if (minRadius === Infinity) {
	            // order collinear points by dx (or dy if all x are identical)
	            // and return the list as a hull
	            for (let i = 0; i < n; i++) {
	                this._dists[i] = (coords[2 * i] - coords[0]) || (coords[2 * i + 1] - coords[1]);
	            }
	            quicksort(this._ids, this._dists, 0, n - 1);
	            const hull = new Uint32Array(n);
	            let j = 0;
	            for (let i = 0, d0 = -Infinity; i < n; i++) {
	                const id = this._ids[i];
	                const d = this._dists[id];
	                if (d > d0) {
	                    hull[j++] = id;
	                    d0 = d;
	                }
	            }
	            this.hull = hull.subarray(0, j);
	            this.triangles = new Uint32Array(0);
	            this.halfedges = new Uint32Array(0);
	            return;
	        }

	        // swap the order of the seed points for counter-clockwise orientation
	        if (orient2d(i0x, i0y, i1x, i1y, i2x, i2y) < 0) {
	            const i = i1;
	            const x = i1x;
	            const y = i1y;
	            i1 = i2;
	            i1x = i2x;
	            i1y = i2y;
	            i2 = i;
	            i2x = x;
	            i2y = y;
	        }

	        const center = circumcenter(i0x, i0y, i1x, i1y, i2x, i2y);
	        this._cx = center.x;
	        this._cy = center.y;

	        for (let i = 0; i < n; i++) {
	            this._dists[i] = dist(coords[2 * i], coords[2 * i + 1], center.x, center.y);
	        }

	        // sort the points by distance from the seed triangle circumcenter
	        quicksort(this._ids, this._dists, 0, n - 1);

	        // set up the seed triangle as the starting hull
	        this._hullStart = i0;
	        let hullSize = 3;

	        hullNext[i0] = hullPrev[i2] = i1;
	        hullNext[i1] = hullPrev[i0] = i2;
	        hullNext[i2] = hullPrev[i1] = i0;

	        hullTri[i0] = 0;
	        hullTri[i1] = 1;
	        hullTri[i2] = 2;

	        hullHash.fill(-1);
	        hullHash[this._hashKey(i0x, i0y)] = i0;
	        hullHash[this._hashKey(i1x, i1y)] = i1;
	        hullHash[this._hashKey(i2x, i2y)] = i2;

	        this.trianglesLen = 0;
	        this._addTriangle(i0, i1, i2, -1, -1, -1);

	        for (let k = 0, xp, yp; k < this._ids.length; k++) {
	            const i = this._ids[k];
	            const x = coords[2 * i];
	            const y = coords[2 * i + 1];

	            // skip near-duplicate points
	            if (k > 0 && Math.abs(x - xp) <= EPSILON && Math.abs(y - yp) <= EPSILON) continue;
	            xp = x;
	            yp = y;

	            // skip seed triangle points
	            if (i === i0 || i === i1 || i === i2) continue;

	            // find a visible edge on the convex hull using edge hash
	            let start = 0;
	            for (let j = 0, key = this._hashKey(x, y); j < this._hashSize; j++) {
	                start = hullHash[(key + j) % this._hashSize];
	                if (start !== -1 && start !== hullNext[start]) break;
	            }

	            start = hullPrev[start];
	            let e = start, q;
	            while (q = hullNext[e], orient2d(x, y, coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1]) >= 0) {
	                e = q;
	                if (e === start) {
	                    e = -1;
	                    break;
	                }
	            }
	            if (e === -1) continue; // likely a near-duplicate point; skip it

	            // add the first triangle from the point
	            let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);

	            // recursively flip triangles from the point until they satisfy the Delaunay condition
	            hullTri[i] = this._legalize(t + 2);
	            hullTri[e] = t; // keep track of boundary triangles on the hull
	            hullSize++;

	            // walk forward through the hull, adding more triangles and flipping recursively
	            let n = hullNext[e];
	            while (q = hullNext[n], orient2d(x, y, coords[2 * n], coords[2 * n + 1], coords[2 * q], coords[2 * q + 1]) < 0) {
	                t = this._addTriangle(n, i, q, hullTri[i], -1, hullTri[n]);
	                hullTri[i] = this._legalize(t + 2);
	                hullNext[n] = n; // mark as removed
	                hullSize--;
	                n = q;
	            }

	            // walk backward from the other side, adding more triangles and flipping
	            if (e === start) {
	                while (q = hullPrev[e], orient2d(x, y, coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1]) < 0) {
	                    t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
	                    this._legalize(t + 2);
	                    hullTri[q] = t;
	                    hullNext[e] = e; // mark as removed
	                    hullSize--;
	                    e = q;
	                }
	            }

	            // update the hull indices
	            this._hullStart = hullPrev[i] = e;
	            hullNext[e] = hullPrev[n] = i;
	            hullNext[i] = n;

	            // save the two new edges in the hash table
	            hullHash[this._hashKey(x, y)] = i;
	            hullHash[this._hashKey(coords[2 * e], coords[2 * e + 1])] = e;
	        }

	        this.hull = new Uint32Array(hullSize);
	        for (let i = 0, e = this._hullStart; i < hullSize; i++) {
	            this.hull[i] = e;
	            e = hullNext[e];
	        }

	        // trim typed triangle mesh arrays
	        this.triangles = this._triangles.subarray(0, this.trianglesLen);
	        this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
	    }

	    _hashKey(x, y) {
	        return Math.floor(pseudoAngle(x - this._cx, y - this._cy) * this._hashSize) % this._hashSize;
	    }

	    _legalize(a) {
	        const {_triangles: triangles, _halfedges: halfedges, coords} = this;

	        let i = 0;
	        let ar = 0;

	        // recursion eliminated with a fixed-size stack
	        while (true) {
	            const b = halfedges[a];

	            /* if the pair of triangles doesn't satisfy the Delaunay condition
	             * (p1 is inside the circumcircle of [p0, pl, pr]), flip them,
	             * then do the same check/flip recursively for the new pair of triangles
	             *
	             *           pl                    pl
	             *          /||\                  /  \
	             *       al/ || \bl            al/    \a
	             *        /  ||  \              /      \
	             *       /  a||b  \    flip    /___ar___\
	             *     p0\   ||   /p1   =>   p0\---bl---/p1
	             *        \  ||  /              \      /
	             *       ar\ || /br             b\    /br
	             *          \||/                  \  /
	             *           pr                    pr
	             */
	            const a0 = a - a % 3;
	            ar = a0 + (a + 2) % 3;

	            if (b === -1) { // convex hull edge
	                if (i === 0) break;
	                a = EDGE_STACK[--i];
	                continue;
	            }

	            const b0 = b - b % 3;
	            const al = a0 + (a + 1) % 3;
	            const bl = b0 + (b + 2) % 3;

	            const p0 = triangles[ar];
	            const pr = triangles[a];
	            const pl = triangles[al];
	            const p1 = triangles[bl];

	            const illegal = inCircle(
	                coords[2 * p0], coords[2 * p0 + 1],
	                coords[2 * pr], coords[2 * pr + 1],
	                coords[2 * pl], coords[2 * pl + 1],
	                coords[2 * p1], coords[2 * p1 + 1]);

	            if (illegal) {
	                triangles[a] = p1;
	                triangles[b] = p0;

	                const hbl = halfedges[bl];

	                // edge swapped on the other side of the hull (rare); fix the halfedge reference
	                if (hbl === -1) {
	                    let e = this._hullStart;
	                    do {
	                        if (this._hullTri[e] === bl) {
	                            this._hullTri[e] = a;
	                            break;
	                        }
	                        e = this._hullPrev[e];
	                    } while (e !== this._hullStart);
	                }
	                this._link(a, hbl);
	                this._link(b, halfedges[ar]);
	                this._link(ar, bl);

	                const br = b0 + (b + 1) % 3;

	                // don't worry about hitting the cap: it can only happen on extremely degenerate input
	                if (i < EDGE_STACK.length) {
	                    EDGE_STACK[i++] = br;
	                }
	            } else {
	                if (i === 0) break;
	                a = EDGE_STACK[--i];
	            }
	        }

	        return ar;
	    }

	    _link(a, b) {
	        this._halfedges[a] = b;
	        if (b !== -1) this._halfedges[b] = a;
	    }

	    // add a new triangle given vertex indices and adjacent half-edge ids
	    _addTriangle(i0, i1, i2, a, b, c) {
	        const t = this.trianglesLen;

	        this._triangles[t] = i0;
	        this._triangles[t + 1] = i1;
	        this._triangles[t + 2] = i2;

	        this._link(t, a);
	        this._link(t + 1, b);
	        this._link(t + 2, c);

	        this.trianglesLen += 3;

	        return t;
	    }
	}

	// monotonically increases with real angle, but doesn't need expensive trigonometry
	function pseudoAngle(dx, dy) {
	    const p = dx / (Math.abs(dx) + Math.abs(dy));
	    return (dy > 0 ? 3 - p : 1 + p) / 4; // [0..1]
	}

	function dist(ax, ay, bx, by) {
	    const dx = ax - bx;
	    const dy = ay - by;
	    return dx * dx + dy * dy;
	}

	function inCircle(ax, ay, bx, by, cx, cy, px, py) {
	    const dx = ax - px;
	    const dy = ay - py;
	    const ex = bx - px;
	    const ey = by - py;
	    const fx = cx - px;
	    const fy = cy - py;

	    const ap = dx * dx + dy * dy;
	    const bp = ex * ex + ey * ey;
	    const cp = fx * fx + fy * fy;

	    return dx * (ey * cp - bp * fy) -
	           dy * (ex * cp - bp * fx) +
	           ap * (ex * fy - ey * fx) < 0;
	}

	function circumradius(ax, ay, bx, by, cx, cy) {
	    const dx = bx - ax;
	    const dy = by - ay;
	    const ex = cx - ax;
	    const ey = cy - ay;

	    const bl = dx * dx + dy * dy;
	    const cl = ex * ex + ey * ey;
	    const d = 0.5 / (dx * ey - dy * ex);

	    const x = (ey * bl - dy * cl) * d;
	    const y = (dx * cl - ex * bl) * d;

	    return x * x + y * y;
	}

	function circumcenter(ax, ay, bx, by, cx, cy) {
	    const dx = bx - ax;
	    const dy = by - ay;
	    const ex = cx - ax;
	    const ey = cy - ay;

	    const bl = dx * dx + dy * dy;
	    const cl = ex * ex + ey * ey;
	    const d = 0.5 / (dx * ey - dy * ex);

	    const x = ax + (ey * bl - dy * cl) * d;
	    const y = ay + (dx * cl - ex * bl) * d;

	    return {x, y};
	}

	function quicksort(ids, dists, left, right) {
	    if (right - left <= 20) {
	        for (let i = left + 1; i <= right; i++) {
	            const temp = ids[i];
	            const tempDist = dists[temp];
	            let j = i - 1;
	            while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
	            ids[j + 1] = temp;
	        }
	    } else {
	        const median = (left + right) >> 1;
	        let i = left + 1;
	        let j = right;
	        swap(ids, median, i);
	        if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
	        if (dists[ids[i]] > dists[ids[right]]) swap(ids, i, right);
	        if (dists[ids[left]] > dists[ids[i]]) swap(ids, left, i);

	        const temp = ids[i];
	        const tempDist = dists[temp];
	        while (true) {
	            do i++; while (dists[ids[i]] < tempDist);
	            do j--; while (dists[ids[j]] > tempDist);
	            if (j < i) break;
	            swap(ids, i, j);
	        }
	        ids[left + 1] = ids[j];
	        ids[j] = temp;

	        if (right - i + 1 >= j - left) {
	            quicksort(ids, dists, i, right);
	            quicksort(ids, dists, left, j - 1);
	        } else {
	            quicksort(ids, dists, left, j - 1);
	            quicksort(ids, dists, i, right);
	        }
	    }
	}

	function swap(arr, i, j) {
	    const tmp = arr[i];
	    arr[i] = arr[j];
	    arr[j] = tmp;
	}

	function defaultGetX(p) {
	    return p[0];
	}
	function defaultGetY(p) {
	    return p[1];
	}

	const epsilon = 1e-6;

	class Path {
	  constructor() {
	    this._x0 = this._y0 = // start of current subpath
	    this._x1 = this._y1 = null; // end of current subpath
	    this._ = "";
	  }
	  moveTo(x, y) {
	    this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
	  }
	  closePath() {
	    if (this._x1 !== null) {
	      this._x1 = this._x0, this._y1 = this._y0;
	      this._ += "Z";
	    }
	  }
	  lineTo(x, y) {
	    this._ += `L${this._x1 = +x},${this._y1 = +y}`;
	  }
	  arc(x, y, r) {
	    x = +x, y = +y, r = +r;
	    const x0 = x + r;
	    const y0 = y;
	    if (r < 0) throw new Error("negative radius");
	    if (this._x1 === null) this._ += `M${x0},${y0}`;
	    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) this._ += "L" + x0 + "," + y0;
	    if (!r) return;
	    this._ += `A${r},${r},0,1,1,${x - r},${y}A${r},${r},0,1,1,${this._x1 = x0},${this._y1 = y0}`;
	  }
	  rect(x, y, w, h) {
	    this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${+w}v${+h}h${-w}Z`;
	  }
	  value() {
	    return this._ || null;
	  }
	}

	class Polygon {
	  constructor() {
	    this._ = [];
	  }
	  moveTo(x, y) {
	    this._.push([x, y]);
	  }
	  closePath() {
	    this._.push(this._[0].slice());
	  }
	  lineTo(x, y) {
	    this._.push([x, y]);
	  }
	  value() {
	    return this._.length ? this._ : null;
	  }
	}

	class Voronoi {
	  constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
	    if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
	    this.delaunay = delaunay;
	    this._circumcenters = new Float64Array(delaunay.points.length * 2);
	    this.vectors = new Float64Array(delaunay.points.length * 2);
	    this.xmax = xmax, this.xmin = xmin;
	    this.ymax = ymax, this.ymin = ymin;
	    this._init();
	  }
	  update() {
	    this.delaunay.update();
	    this._init();
	    return this;
	  }
	  _init() {
	    const {delaunay: {points, hull, triangles}, vectors} = this;
	    let bx, by; // lazily computed barycenter of the hull

	    // Compute circumcenters.
	    const circumcenters = this.circumcenters = this._circumcenters.subarray(0, triangles.length / 3 * 2);
	    for (let i = 0, j = 0, n = triangles.length, x, y; i < n; i += 3, j += 2) {
	      const t1 = triangles[i] * 2;
	      const t2 = triangles[i + 1] * 2;
	      const t3 = triangles[i + 2] * 2;
	      const x1 = points[t1];
	      const y1 = points[t1 + 1];
	      const x2 = points[t2];
	      const y2 = points[t2 + 1];
	      const x3 = points[t3];
	      const y3 = points[t3 + 1];

	      const dx = x2 - x1;
	      const dy = y2 - y1;
	      const ex = x3 - x1;
	      const ey = y3 - y1;
	      const ab = (dx * ey - dy * ex) * 2;

	      if (Math.abs(ab) < 1e-9) {
	        // For a degenerate triangle, the circumcenter is at the infinity, in a
	        // direction orthogonal to the halfedge and away from the “center” of
	        // the diagram <bx, by>, defined as the hull’s barycenter.
	        if (bx === undefined) {
	          bx = by = 0;
	          for (const i of hull) bx += points[i * 2], by += points[i * 2 + 1];
	          bx /= hull.length, by /= hull.length;
	        }
	        const a = 1e9 * Math.sign((bx - x1) * ey - (by - y1) * ex);
	        x = (x1 + x3) / 2 - a * ey;
	        y = (y1 + y3) / 2 + a * ex;
	      } else {
	        const d = 1 / ab;
	        const bl = dx * dx + dy * dy;
	        const cl = ex * ex + ey * ey;
	        x = x1 + (ey * bl - dy * cl) * d;
	        y = y1 + (dx * cl - ex * bl) * d;
	      }
	      circumcenters[j] = x;
	      circumcenters[j + 1] = y;
	    }

	    // Compute exterior cell rays.
	    let h = hull[hull.length - 1];
	    let p0, p1 = h * 4;
	    let x0, x1 = points[2 * h];
	    let y0, y1 = points[2 * h + 1];
	    vectors.fill(0);
	    for (let i = 0; i < hull.length; ++i) {
	      h = hull[i];
	      p0 = p1, x0 = x1, y0 = y1;
	      p1 = h * 4, x1 = points[2 * h], y1 = points[2 * h + 1];
	      vectors[p0 + 2] = vectors[p1] = y0 - y1;
	      vectors[p0 + 3] = vectors[p1 + 1] = x1 - x0;
	    }
	  }
	  render(context) {
	    const buffer = context == null ? context = new Path : undefined;
	    const {delaunay: {halfedges, inedges, hull}, circumcenters, vectors} = this;
	    if (hull.length <= 1) return null;
	    for (let i = 0, n = halfedges.length; i < n; ++i) {
	      const j = halfedges[i];
	      if (j < i) continue;
	      const ti = Math.floor(i / 3) * 2;
	      const tj = Math.floor(j / 3) * 2;
	      const xi = circumcenters[ti];
	      const yi = circumcenters[ti + 1];
	      const xj = circumcenters[tj];
	      const yj = circumcenters[tj + 1];
	      this._renderSegment(xi, yi, xj, yj, context);
	    }
	    let h0, h1 = hull[hull.length - 1];
	    for (let i = 0; i < hull.length; ++i) {
	      h0 = h1, h1 = hull[i];
	      const t = Math.floor(inedges[h1] / 3) * 2;
	      const x = circumcenters[t];
	      const y = circumcenters[t + 1];
	      const v = h0 * 4;
	      const p = this._project(x, y, vectors[v + 2], vectors[v + 3]);
	      if (p) this._renderSegment(x, y, p[0], p[1], context);
	    }
	    return buffer && buffer.value();
	  }
	  renderBounds(context) {
	    const buffer = context == null ? context = new Path : undefined;
	    context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
	    return buffer && buffer.value();
	  }
	  renderCell(i, context) {
	    const buffer = context == null ? context = new Path : undefined;
	    const points = this._clip(i);
	    if (points === null || !points.length) return;
	    context.moveTo(points[0], points[1]);
	    let n = points.length;
	    while (points[0] === points[n-2] && points[1] === points[n-1] && n > 1) n -= 2;
	    for (let i = 2; i < n; i += 2) {
	      if (points[i] !== points[i-2] || points[i+1] !== points[i-1])
	        context.lineTo(points[i], points[i + 1]);
	    }
	    context.closePath();
	    return buffer && buffer.value();
	  }
	  *cellPolygons() {
	    const {delaunay: {points}} = this;
	    for (let i = 0, n = points.length / 2; i < n; ++i) {
	      const cell = this.cellPolygon(i);
	      if (cell) cell.index = i, yield cell;
	    }
	  }
	  cellPolygon(i) {
	    const polygon = new Polygon;
	    this.renderCell(i, polygon);
	    return polygon.value();
	  }
	  _renderSegment(x0, y0, x1, y1, context) {
	    let S;
	    const c0 = this._regioncode(x0, y0);
	    const c1 = this._regioncode(x1, y1);
	    if (c0 === 0 && c1 === 0) {
	      context.moveTo(x0, y0);
	      context.lineTo(x1, y1);
	    } else if (S = this._clipSegment(x0, y0, x1, y1, c0, c1)) {
	      context.moveTo(S[0], S[1]);
	      context.lineTo(S[2], S[3]);
	    }
	  }
	  contains(i, x, y) {
	    if ((x = +x, x !== x) || (y = +y, y !== y)) return false;
	    return this.delaunay._step(i, x, y) === i;
	  }
	  *neighbors(i) {
	    const ci = this._clip(i);
	    if (ci) for (const j of this.delaunay.neighbors(i)) {
	      const cj = this._clip(j);
	      // find the common edge
	      if (cj) loop: for (let ai = 0, li = ci.length; ai < li; ai += 2) {
	        for (let aj = 0, lj = cj.length; aj < lj; aj += 2) {
	          if (ci[ai] === cj[aj]
	              && ci[ai + 1] === cj[aj + 1]
	              && ci[(ai + 2) % li] === cj[(aj + lj - 2) % lj]
	              && ci[(ai + 3) % li] === cj[(aj + lj - 1) % lj]) {
	            yield j;
	            break loop;
	          }
	        }
	      }
	    }
	  }
	  _cell(i) {
	    const {circumcenters, delaunay: {inedges, halfedges, triangles}} = this;
	    const e0 = inedges[i];
	    if (e0 === -1) return null; // coincident point
	    const points = [];
	    let e = e0;
	    do {
	      const t = Math.floor(e / 3);
	      points.push(circumcenters[t * 2], circumcenters[t * 2 + 1]);
	      e = e % 3 === 2 ? e - 2 : e + 1;
	      if (triangles[e] !== i) break; // bad triangulation
	      e = halfedges[e];
	    } while (e !== e0 && e !== -1);
	    return points;
	  }
	  _clip(i) {
	    // degenerate case (1 valid point: return the box)
	    if (i === 0 && this.delaunay.hull.length === 1) {
	      return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
	    }
	    const points = this._cell(i);
	    if (points === null) return null;
	    const {vectors: V} = this;
	    const v = i * 4;
	    return this._simplify(V[v] || V[v + 1]
	        ? this._clipInfinite(i, points, V[v], V[v + 1], V[v + 2], V[v + 3])
	        : this._clipFinite(i, points));
	  }
	  _clipFinite(i, points) {
	    const n = points.length;
	    let P = null;
	    let x0, y0, x1 = points[n - 2], y1 = points[n - 1];
	    let c0, c1 = this._regioncode(x1, y1);
	    let e0, e1 = 0;
	    for (let j = 0; j < n; j += 2) {
	      x0 = x1, y0 = y1, x1 = points[j], y1 = points[j + 1];
	      c0 = c1, c1 = this._regioncode(x1, y1);
	      if (c0 === 0 && c1 === 0) {
	        e0 = e1, e1 = 0;
	        if (P) P.push(x1, y1);
	        else P = [x1, y1];
	      } else {
	        let S, sx0, sy0, sx1, sy1;
	        if (c0 === 0) {
	          if ((S = this._clipSegment(x0, y0, x1, y1, c0, c1)) === null) continue;
	          [sx0, sy0, sx1, sy1] = S;
	        } else {
	          if ((S = this._clipSegment(x1, y1, x0, y0, c1, c0)) === null) continue;
	          [sx1, sy1, sx0, sy0] = S;
	          e0 = e1, e1 = this._edgecode(sx0, sy0);
	          if (e0 && e1) this._edge(i, e0, e1, P, P.length);
	          if (P) P.push(sx0, sy0);
	          else P = [sx0, sy0];
	        }
	        e0 = e1, e1 = this._edgecode(sx1, sy1);
	        if (e0 && e1) this._edge(i, e0, e1, P, P.length);
	        if (P) P.push(sx1, sy1);
	        else P = [sx1, sy1];
	      }
	    }
	    if (P) {
	      e0 = e1, e1 = this._edgecode(P[0], P[1]);
	      if (e0 && e1) this._edge(i, e0, e1, P, P.length);
	    } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
	      return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
	    }
	    return P;
	  }
	  _clipSegment(x0, y0, x1, y1, c0, c1) {
	    // for more robustness, always consider the segment in the same order
	    const flip = c0 < c1;
	    if (flip) [x0, y0, x1, y1, c0, c1] = [x1, y1, x0, y0, c1, c0];
	    while (true) {
	      if (c0 === 0 && c1 === 0) return flip ? [x1, y1, x0, y0] : [x0, y0, x1, y1];
	      if (c0 & c1) return null;
	      let x, y, c = c0 || c1;
	      if (c & 0b1000) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax;
	      else if (c & 0b0100) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin;
	      else if (c & 0b0010) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax;
	      else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin;
	      if (c0) x0 = x, y0 = y, c0 = this._regioncode(x0, y0);
	      else x1 = x, y1 = y, c1 = this._regioncode(x1, y1);
	    }
	  }
	  _clipInfinite(i, points, vx0, vy0, vxn, vyn) {
	    let P = Array.from(points), p;
	    if (p = this._project(P[0], P[1], vx0, vy0)) P.unshift(p[0], p[1]);
	    if (p = this._project(P[P.length - 2], P[P.length - 1], vxn, vyn)) P.push(p[0], p[1]);
	    if (P = this._clipFinite(i, P)) {
	      for (let j = 0, n = P.length, c0, c1 = this._edgecode(P[n - 2], P[n - 1]); j < n; j += 2) {
	        c0 = c1, c1 = this._edgecode(P[j], P[j + 1]);
	        if (c0 && c1) j = this._edge(i, c0, c1, P, j), n = P.length;
	      }
	    } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
	      P = [this.xmin, this.ymin, this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax];
	    }
	    return P;
	  }
	  _edge(i, e0, e1, P, j) {
	    while (e0 !== e1) {
	      let x, y;
	      switch (e0) {
	        case 0b0101: e0 = 0b0100; continue; // top-left
	        case 0b0100: e0 = 0b0110, x = this.xmax, y = this.ymin; break; // top
	        case 0b0110: e0 = 0b0010; continue; // top-right
	        case 0b0010: e0 = 0b1010, x = this.xmax, y = this.ymax; break; // right
	        case 0b1010: e0 = 0b1000; continue; // bottom-right
	        case 0b1000: e0 = 0b1001, x = this.xmin, y = this.ymax; break; // bottom
	        case 0b1001: e0 = 0b0001; continue; // bottom-left
	        case 0b0001: e0 = 0b0101, x = this.xmin, y = this.ymin; break; // left
	      }
	      // Note: this implicitly checks for out of bounds: if P[j] or P[j+1] are
	      // undefined, the conditional statement will be executed.
	      if ((P[j] !== x || P[j + 1] !== y) && this.contains(i, x, y)) {
	        P.splice(j, 0, x, y), j += 2;
	      }
	    }
	    return j;
	  }
	  _project(x0, y0, vx, vy) {
	    let t = Infinity, c, x, y;
	    if (vy < 0) { // top
	      if (y0 <= this.ymin) return null;
	      if ((c = (this.ymin - y0) / vy) < t) y = this.ymin, x = x0 + (t = c) * vx;
	    } else if (vy > 0) { // bottom
	      if (y0 >= this.ymax) return null;
	      if ((c = (this.ymax - y0) / vy) < t) y = this.ymax, x = x0 + (t = c) * vx;
	    }
	    if (vx > 0) { // right
	      if (x0 >= this.xmax) return null;
	      if ((c = (this.xmax - x0) / vx) < t) x = this.xmax, y = y0 + (t = c) * vy;
	    } else if (vx < 0) { // left
	      if (x0 <= this.xmin) return null;
	      if ((c = (this.xmin - x0) / vx) < t) x = this.xmin, y = y0 + (t = c) * vy;
	    }
	    return [x, y];
	  }
	  _edgecode(x, y) {
	    return (x === this.xmin ? 0b0001
	        : x === this.xmax ? 0b0010 : 0b0000)
	        | (y === this.ymin ? 0b0100
	        : y === this.ymax ? 0b1000 : 0b0000);
	  }
	  _regioncode(x, y) {
	    return (x < this.xmin ? 0b0001
	        : x > this.xmax ? 0b0010 : 0b0000)
	        | (y < this.ymin ? 0b0100
	        : y > this.ymax ? 0b1000 : 0b0000);
	  }
	  _simplify(P) {
	    if (P && P.length > 4) {
	      for (let i = 0; i < P.length; i+= 2) {
	        const j = (i + 2) % P.length, k = (i + 4) % P.length;
	        if (P[i] === P[j] && P[j] === P[k] || P[i + 1] === P[j + 1] && P[j + 1] === P[k + 1]) {
	          P.splice(j, 2), i -= 2;
	        }
	      }
	      if (!P.length) P = null;
	    }
	    return P;
	  }
	}

	const tau = 2 * Math.PI, pow = Math.pow;

	function pointX(p) {
	  return p[0];
	}

	function pointY(p) {
	  return p[1];
	}

	// A triangulation is collinear if all its triangles have a non-null area
	function collinear(d) {
	  const {triangles, coords} = d;
	  for (let i = 0; i < triangles.length; i += 3) {
	    const a = 2 * triangles[i],
	          b = 2 * triangles[i + 1],
	          c = 2 * triangles[i + 2],
	          cross = (coords[c] - coords[a]) * (coords[b + 1] - coords[a + 1])
	                - (coords[b] - coords[a]) * (coords[c + 1] - coords[a + 1]);
	    if (cross > 1e-10) return false;
	  }
	  return true;
	}

	function jitter(x, y, r) {
	  return [x + Math.sin(x + y) * r, y + Math.cos(x - y) * r];
	}

	class Delaunay {
	  static from(points, fx = pointX, fy = pointY, that) {
	    return new Delaunay("length" in points
	        ? flatArray(points, fx, fy, that)
	        : Float64Array.from(flatIterable(points, fx, fy, that)));
	  }
	  constructor(points) {
	    this._delaunator = new Delaunator(points);
	    this.inedges = new Int32Array(points.length / 2);
	    this._hullIndex = new Int32Array(points.length / 2);
	    this.points = this._delaunator.coords;
	    this._init();
	  }
	  update() {
	    this._delaunator.update();
	    this._init();
	    return this;
	  }
	  _init() {
	    const d = this._delaunator, points = this.points;

	    // check for collinear
	    if (d.hull && d.hull.length > 2 && collinear(d)) {
	      this.collinear = Int32Array.from({length: points.length/2}, (_,i) => i)
	        .sort((i, j) => points[2 * i] - points[2 * j] || points[2 * i + 1] - points[2 * j + 1]); // for exact neighbors
	      const e = this.collinear[0], f = this.collinear[this.collinear.length - 1],
	        bounds = [ points[2 * e], points[2 * e + 1], points[2 * f], points[2 * f + 1] ],
	        r = 1e-8 * Math.hypot(bounds[3] - bounds[1], bounds[2] - bounds[0]);
	      for (let i = 0, n = points.length / 2; i < n; ++i) {
	        const p = jitter(points[2 * i], points[2 * i + 1], r);
	        points[2 * i] = p[0];
	        points[2 * i + 1] = p[1];
	      }
	      this._delaunator = new Delaunator(points);
	    } else {
	      delete this.collinear;
	    }

	    const halfedges = this.halfedges = this._delaunator.halfedges;
	    const hull = this.hull = this._delaunator.hull;
	    const triangles = this.triangles = this._delaunator.triangles;
	    const inedges = this.inedges.fill(-1);
	    const hullIndex = this._hullIndex.fill(-1);

	    // Compute an index from each point to an (arbitrary) incoming halfedge
	    // Used to give the first neighbor of each point; for this reason,
	    // on the hull we give priority to exterior halfedges
	    for (let e = 0, n = halfedges.length; e < n; ++e) {
	      const p = triangles[e % 3 === 2 ? e - 2 : e + 1];
	      if (halfedges[e] === -1 || inedges[p] === -1) inedges[p] = e;
	    }
	    for (let i = 0, n = hull.length; i < n; ++i) {
	      hullIndex[hull[i]] = i;
	    }

	    // degenerate case: 1 or 2 (distinct) points
	    if (hull.length <= 2 && hull.length > 0) {
	      this.triangles = new Int32Array(3).fill(-1);
	      this.halfedges = new Int32Array(3).fill(-1);
	      this.triangles[0] = hull[0];
	      inedges[hull[0]] = 1;
	      if (hull.length === 2) {
	        inedges[hull[1]] = 0;
	        this.triangles[1] = hull[1];
	        this.triangles[2] = hull[1];
	      }
	    }
	  }
	  voronoi(bounds) {
	    return new Voronoi(this, bounds);
	  }
	  *neighbors(i) {
	    const {inedges, hull, _hullIndex, halfedges, triangles, collinear} = this;

	    // degenerate case with several collinear points
	    if (collinear) {
	      const l = collinear.indexOf(i);
	      if (l > 0) yield collinear[l - 1];
	      if (l < collinear.length - 1) yield collinear[l + 1];
	      return;
	    }

	    const e0 = inedges[i];
	    if (e0 === -1) return; // coincident point
	    let e = e0, p0 = -1;
	    do {
	      yield p0 = triangles[e];
	      e = e % 3 === 2 ? e - 2 : e + 1;
	      if (triangles[e] !== i) return; // bad triangulation
	      e = halfedges[e];
	      if (e === -1) {
	        const p = hull[(_hullIndex[i] + 1) % hull.length];
	        if (p !== p0) yield p;
	        return;
	      }
	    } while (e !== e0);
	  }
	  find(x, y, i = 0) {
	    if ((x = +x, x !== x) || (y = +y, y !== y)) return -1;
	    const i0 = i;
	    let c;
	    while ((c = this._step(i, x, y)) >= 0 && c !== i && c !== i0) i = c;
	    return c;
	  }
	  _step(i, x, y) {
	    const {inedges, hull, _hullIndex, halfedges, triangles, points} = this;
	    if (inedges[i] === -1 || !points.length) return (i + 1) % (points.length >> 1);
	    let c = i;
	    let dc = pow(x - points[i * 2], 2) + pow(y - points[i * 2 + 1], 2);
	    const e0 = inedges[i];
	    let e = e0;
	    do {
	      let t = triangles[e];
	      const dt = pow(x - points[t * 2], 2) + pow(y - points[t * 2 + 1], 2);
	      if (dt < dc) dc = dt, c = t;
	      e = e % 3 === 2 ? e - 2 : e + 1;
	      if (triangles[e] !== i) break; // bad triangulation
	      e = halfedges[e];
	      if (e === -1) {
	        e = hull[(_hullIndex[i] + 1) % hull.length];
	        if (e !== t) {
	          if (pow(x - points[e * 2], 2) + pow(y - points[e * 2 + 1], 2) < dc) return e;
	        }
	        break;
	      }
	    } while (e !== e0);
	    return c;
	  }
	  render(context) {
	    const buffer = context == null ? context = new Path : undefined;
	    const {points, halfedges, triangles} = this;
	    for (let i = 0, n = halfedges.length; i < n; ++i) {
	      const j = halfedges[i];
	      if (j < i) continue;
	      const ti = triangles[i] * 2;
	      const tj = triangles[j] * 2;
	      context.moveTo(points[ti], points[ti + 1]);
	      context.lineTo(points[tj], points[tj + 1]);
	    }
	    this.renderHull(context);
	    return buffer && buffer.value();
	  }
	  renderPoints(context, r) {
	    if (r === undefined && (!context || typeof context.moveTo !== "function")) r = context, context = null;
	    r = r == undefined ? 2 : +r;
	    const buffer = context == null ? context = new Path : undefined;
	    const {points} = this;
	    for (let i = 0, n = points.length; i < n; i += 2) {
	      const x = points[i], y = points[i + 1];
	      context.moveTo(x + r, y);
	      context.arc(x, y, r, 0, tau);
	    }
	    return buffer && buffer.value();
	  }
	  renderHull(context) {
	    const buffer = context == null ? context = new Path : undefined;
	    const {hull, points} = this;
	    const h = hull[0] * 2, n = hull.length;
	    context.moveTo(points[h], points[h + 1]);
	    for (let i = 1; i < n; ++i) {
	      const h = 2 * hull[i];
	      context.lineTo(points[h], points[h + 1]);
	    }
	    context.closePath();
	    return buffer && buffer.value();
	  }
	  hullPolygon() {
	    const polygon = new Polygon;
	    this.renderHull(polygon);
	    return polygon.value();
	  }
	  renderTriangle(i, context) {
	    const buffer = context == null ? context = new Path : undefined;
	    const {points, triangles} = this;
	    const t0 = triangles[i *= 3] * 2;
	    const t1 = triangles[i + 1] * 2;
	    const t2 = triangles[i + 2] * 2;
	    context.moveTo(points[t0], points[t0 + 1]);
	    context.lineTo(points[t1], points[t1 + 1]);
	    context.lineTo(points[t2], points[t2 + 1]);
	    context.closePath();
	    return buffer && buffer.value();
	  }
	  *trianglePolygons() {
	    const {triangles} = this;
	    for (let i = 0, n = triangles.length / 3; i < n; ++i) {
	      yield this.trianglePolygon(i);
	    }
	  }
	  trianglePolygon(i) {
	    const polygon = new Polygon;
	    this.renderTriangle(i, polygon);
	    return polygon.value();
	  }
	}

	function flatArray(points, fx, fy, that) {
	  const n = points.length;
	  const array = new Float64Array(n * 2);
	  for (let i = 0; i < n; ++i) {
	    const p = points[i];
	    array[i * 2] = fx.call(that, p, i, points);
	    array[i * 2 + 1] = fy.call(that, p, i, points);
	  }
	  return array;
	}

	function* flatIterable(points, fx, fy, that) {
	  let i = 0;
	  for (const p of points) {
	    yield fx.call(that, p, i, points);
	    yield fy.call(that, p, i, points);
	    ++i;
	  }
	}

	const CANVAS_VORONOI_STIPPLE_SCALE = 2.25;
	function fromVoronoiCanvasStipple(x, y, targetWidth, targetHeight, canvasWidth, canvasHeight) {
	    x = x / CANVAS_VORONOI_STIPPLE_SCALE;
	    y = y / CANVAS_VORONOI_STIPPLE_SCALE;
	    const scaleX = targetWidth / canvasWidth;
	    const scaleY = targetHeight / canvasHeight;
	    const w = -(canvasWidth / 2) * scaleX;
	    const h = -(canvasHeight / 2) * scaleY;
	    const scaledX = (x - w) / scaleX;
	    const scaledY = (y - h) / scaleY;
	    let p = new Point3(Math.round(scaledX), Math.round(scaledY), 0);
	    return p;
	}
	function toVoronoiCanvasStipple(x, y, targetWidth, targetHeight, canvasWidth, canvasHeight) {
	    const scaleX = targetWidth / canvasWidth;
	    const scaleY = targetHeight / canvasHeight;
	    const w = -(canvasWidth / 2) * scaleX;
	    const h = -(canvasHeight / 2) * scaleX;
	    const scaledX = w + (x * scaleX);
	    const scaledY = h + (y * scaleY);
	    let p = new Point3(scaledX, scaledY, 0);
	    p = multiplyPointByScalar(p, CANVAS_VORONOI_STIPPLE_SCALE);
	    return p;
	}
	class WeightedVoronoiStipple extends Point3 {
	    radius;
	    color;
	    constructor(x, y, radius, color) {
	        super(x, y, 0);
	        this.radius = radius;
	        this.color = color;
	    }
	}
	class VoronoiCell extends PolygonShape {
	    seed;
	    centroid;
	    original = true;
	    weightedCentroid = null;
	    static THRESHOLD_CONVERGENCE = 0.0001;
	    constructor(seed, points, original = true) {
	        super(points);
	        this.seed = seed;
	        this.centroid = calculateCentroidZeroZ([...points]);
	        if (this.centroid.sub(this.seed).lengthSq() < VoronoiCell.THRESHOLD_CONVERGENCE) {
	            this.centroid = this.seed.clone();
	        }
	        this.original = original;
	    }
	    getEdges() {
	        let ret = [];
	        for (let i = 0; i < this.points.length; i++) {
	            ret.push(new PolygonEdge(this.points[i], this.points[(i + 1) % this.points.length]));
	        }
	        return ret;
	    }
	    getWeightedCentroidBasedOnImage = (imageData, factor) => {
	        if (this.weightedCentroid)
	            return this.weightedCentroid;
	        const aspect = imageData.width / imageData.height;
	        const factorX = factor;
	        const factorY = factor / aspect;
	        const coordX = this.seed.x;
	        const coordY = this.seed.y;
	        let p = fromVoronoiCanvasStipple(this.seed.x, this.seed.y, factorX, factorY, imageData.width, imageData.height);
	        const index = (p.y * imageData.width + p.x) * 4;
	        const r = imageData.data[index + 0];
	        const g = imageData.data[index + 1];
	        const b = imageData.data[index + 2];
	        const a = imageData.data[index + 3];
	        const stippleColor = new Color(r / 255, g / 255, b / 255);
	        const brightness = 1 - (((r + g + b) / 3) / 255);
	        const ret = a === 0 ? null : new WeightedVoronoiStipple(coordX, coordY, brightness, '#' + stippleColor.getHexString());
	        this.weightedCentroid = ret;
	        return ret;
	    };
	}
	class VoronoiDiagram extends DualGraph {
	    triangulationEdges = [];
	    getSeeds = () => {
	        return this.shapes.flatMap(x => x.seed);
	    };
	    isCentroidal = () => {
	        return this.shapes.filter(x => x.original).every(x => x.seed.equals(x.centroid));
	    };
	    getLloydRelaxationPoints = () => {
	        const ret = [];
	        const originals = this.shapes.filter(s => s.original);
	        for (const cell of originals) {
	            ret.push(cell.centroid);
	        }
	        return ret;
	    };
	    getWeightedVoronoiStipples = (imageData, factor) => {
	        const ret = [];
	        const aspect = imageData.width / imageData.height;
	        const factorX = factor;
	        const factorY = factor / aspect;
	        const points = this.getSeeds().map(x => {
	            const p = fromVoronoiCanvasStipple(x.x, x.y, factorX, factorY, imageData.width, imageData.height);
	            return [p.x, p.y];
	        });
	        const delaunay = Delaunay.from(points);
	        const centroids = new Array(this.shapes.length);
	        for (let i = 0; i < centroids.length; i++) {
	            centroids[i] = new Point3(0, 0, 0);
	        }
	        const weights = new Array(this.shapes.length).fill(0);
	        let delaunayIndex = 0;
	        for (let i = 0; i < imageData.width; i++) {
	            for (let j = 0; j < imageData.height; j++) {
	                const index = (j * imageData.width + i) * 4;
	                const a = imageData.data[index + 3];
	                if (a !== 0) {
	                    const r = imageData.data[index + 0];
	                    const g = imageData.data[index + 1];
	                    const b = imageData.data[index + 2];
	                    const value = (r + g + b) / 3;
	                    const weight = 1 - (value / 255);
	                    delaunayIndex = delaunay.find(i, j, delaunayIndex);
	                    centroids[delaunayIndex].x += i * weight;
	                    centroids[delaunayIndex].y += j * weight;
	                    weights[delaunayIndex] += weight;
	                }
	            }
	        }
	        for (let i = 0; i < centroids.length; i++) {
	            let v;
	            if (weights[i] > 0) {
	                v = [centroids[i].x / weights[i], centroids[i].y / weights[i]];
	            }
	            else {
	                v = [points[i][0], points[i][1]];
	            }
	            let pushed = toVoronoiCanvasStipple(v[0], v[1], factorX, factorY, imageData.width, imageData.height);
	            ret.push(pushed);
	        }
	        return ret;
	    };
	    toPlainObject() {
	        return {
	            shapes: this.shapes.map(shape => ({
	                seed: { x: shape.seed.x, y: shape.seed.y },
	                points: shape.points.map(p => ({ x: p.x, y: p.y }))
	            })),
	            edges: this.triangulationEdges.map(edge => ({
	                start: ({ x: edge.start.x, y: edge.start.y }),
	                end: ({ x: edge.end.x, y: edge.end.y })
	            }))
	        };
	    }
	    static fromPlainObject(plain) {
	        const ret = new VoronoiDiagram([]);
	        ret.triangulationEdges = plain.edges.map(ed => new PolygonEdge(new Point3(ed.start.x, ed.start.y, 0), new Point3(ed.end.x, ed.end.y, 0)));
	        ret.shapes = plain.shapes.map(sp => new VoronoiCell(new Point3(sp.seed.x, sp.seed.y), sp.points.map(p => new Point3(p.x, p.y, 0)), true));
	        return ret;
	    }
	    static buildWithD3Delaunay = (proposedPolygon, width = 8, height = 8) => {
	        const delaunay = Delaunay.from(proposedPolygon.map(x => [x.x, x.y]));
	        const ret = new VoronoiDiagram([]);
	        const d3Voronoi = delaunay.voronoi([-width, -height, width, height]);
	        for (let i = 0; i < delaunay.points.length / 2; i++) {
	            const seed = new Point3(delaunay.points[2 * i], delaunay.points[2 * i + 1], 0);
	            const d3Cell = d3Voronoi.cellPolygon(i);
	            if (!d3Cell)
	                continue;
	            const points = Array.from(d3Cell, ([x, y]) => new Point3(x, y, 0));
	            const cell = new VoronoiCell(seed, points, true);
	            ret.addShape(cell);
	        }
	        for (let t = 0; t < delaunay.triangles.length; t += 3) {
	            const p0 = new Point3(delaunay.points[2 * delaunay.triangles[t]], delaunay.points[2 * delaunay.triangles[t] + 1], 0);
	            const p1 = new Point3(delaunay.points[2 * delaunay.triangles[t + 1]], delaunay.points[2 * delaunay.triangles[t + 1] + 1], 0);
	            const p2 = new Point3(delaunay.points[2 * delaunay.triangles[t + 2]], delaunay.points[2 * delaunay.triangles[t + 2] + 1], 0);
	            const edges = [
	                new PolygonEdge(p0, p1),
	                new PolygonEdge(p1, p2),
	                new PolygonEdge(p2, p0)
	            ];
	            for (const edge of edges) {
	                if (!ret.triangulationEdges.some(e => e.equals(edge))) {
	                    ret.triangulationEdges.push(edge);
	                }
	            }
	        }
	        return ret;
	    };
	    static buildWithD3DelaunayPlainObject = (proposedPolygon, width = 8, height = 8) => {
	        const delaunay = Delaunay.from(proposedPolygon);
	        const ret = {
	            shapes: [],
	            edges: []
	        };
	        const d3Voronoi = delaunay.voronoi([-width, -height, width, height]);
	        for (let i = 0; i < delaunay.points.length / 2; i++) {
	            const seed = new Point3(delaunay.points[2 * i], delaunay.points[2 * i + 1], 0);
	            const d3Cell = d3Voronoi.cellPolygon(i);
	            if (!d3Cell)
	                continue;
	            const points = Array.from(d3Cell, ([x, y]) => new Point3(x, y, 0));
	            ret.shapes.push({ seed: { x: seed.x, y: seed.y }, points: points.map(x => ({ x: x.x, y: x.y })) });
	        }
	        for (let t = 0; t < delaunay.triangles.length; t += 3) {
	            const p0 = { x: delaunay.points[2 * delaunay.triangles[t]], y: delaunay.points[2 * delaunay.triangles[t] + 1] };
	            const p1 = { x: delaunay.points[2 * delaunay.triangles[t + 1]], y: delaunay.points[2 * delaunay.triangles[t + 1] + 1] };
	            const p2 = { x: delaunay.points[2 * delaunay.triangles[t + 2]], y: delaunay.points[2 * delaunay.triangles[t + 2] + 1] };
	            ret.edges.push({ start: p0, end: p1 });
	            ret.edges.push({ start: p1, end: p2 });
	            ret.edges.push({ start: p2, end: p0 });
	        }
	        return ret;
	    };
	    static buildFromDelaunayDualGraph = (dualGraph, proposedPolygon, width = 8, height = 8) => {
	        const ret = new VoronoiDiagram([]);
	        const nodes = dualGraph.getTraversalOrdered();
	        const seeds = [];
	        for (const node of nodes) {
	            let halfEdge = node.firstHalfEdge;
	            do {
	                const seed = halfEdge.vertex;
	                if (!seeds.some(s => s.equals(seed))) {
	                    seeds.push(seed);
	                }
	                for (let e of halfEdge.node.shape.getEdges()) {
	                    if (!ret.triangulationEdges.some(te => te.equals(e))) {
	                        ret.triangulationEdges.push(e);
	                    }
	                }
	                halfEdge = halfEdge?.next;
	            } while (halfEdge && halfEdge !== node.firstHalfEdge);
	        }
	        for (const seed of seeds) {
	            const connectedTriangles = dualGraph.shapes.filter(x => x.points.some(p => p.equals(seed)));
	            let points = [];
	            for (const ct of connectedTriangles) {
	                try {
	                    const circum = calcCircumcircle(ct.points[0], ct.points[1], ct.points[2]);
	                    points.push(circum.origin);
	                }
	                catch (e) {
	                }
	            }
	            points = sortConvexPointsCCW(points);
	            const newPoints = [];
	            for (let i = 0; i < points.length; i++) {
	                const start = points[i];
	                const end = points[(i + 1) % points.length];
	                let startClipped = [start.x, start.y];
	                let endClipped = [end.x, end.y];
	                let clipped = clip([start.x, start.y], [end.x, end.y], [-width, -height, width, height], startClipped, endClipped);
	                if (clipped) {
	                    newPoints.push(new Point3(startClipped[0], startClipped[1], 0));
	                    newPoints.push(new Point3(endClipped[0], endClipped[1], 0));
	                }
	                else if (start.x < width && start.x > -width && start.y < height && start.y > -height) {
	                    newPoints.push(start);
	                }
	            }
	            points = newPoints; // Update points with the new clipped points for the next iteration
	            let idxTopRight = points.findIndex((curr, idx) => {
	                let next = points[(idx + 1) % points.length];
	                return curr.y === height && next.x === width;
	            });
	            if (idxTopRight !== -1) {
	                points.splice(idxTopRight + 1, 0, new Point3(width, height));
	            }
	            let idxTopLeft = points.findIndex((curr, idx) => {
	                let next = points[(idx + 1) % points.length];
	                return next.y === height && curr.x === -width;
	            });
	            if (idxTopLeft !== -1) {
	                points.splice(idxTopLeft + 1, 0, new Point3(-width, height));
	            }
	            let idxBottomRight = points.findIndex((curr, idx) => {
	                let next = points[(idx + 1) % points.length];
	                return next.y === -height && curr.x === width;
	            });
	            if (idxBottomRight !== -1) {
	                points.splice(idxBottomRight + 1, 0, new Point3(width, -height));
	            }
	            let idxBottomLeft = points.findIndex((curr, idx) => {
	                let next = points[(idx + 1) % points.length];
	                return curr.y === -height && next.x === -width;
	            });
	            if (idxBottomLeft !== -1) {
	                points.splice(idxBottomLeft + 1, 0, new Point3(-width, -height));
	            }
	            const cell = new VoronoiCell(seed, points, proposedPolygon.some(p => p.equals(seed)));
	            ret.addShape(cell);
	        }
	        return ret;
	    };
	}
	function voronoiDiagramFromD3DelaunayPlainObject(proposedPolygon, width = 8, height = 8) {
	    return VoronoiDiagram.buildWithD3DelaunayPlainObject(proposedPolygon, width, height);
	}

	self.onmessage = (event) => {
	    const { points, width, height } = event.data;
	    const result = voronoiDiagramFromD3DelaunayPlainObject(points, width, height);
	    self.postMessage({ result });
	};

})();
