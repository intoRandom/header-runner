import { useEffect, useRef, useState } from 'react';

const INITIAL_FRAME_INTERVAL = 300;
const SCORE_TICKS = 10;
const JUMP_TICKS = 4;
const MIN_OBSTACLE_DISTANCE = 8;
const ARR_LENGTH = 17;
const PLAYER_INDEX = ARR_LENGTH - 1;

type StatusType = 'idle' | 'running' | 'jumping' | 'gameOver' | 'paused';

const WALK = '🚶';
const RUN = '🏃';
const DEAD = '❌';
const EMPTY = '_';
const OBSTACLE = '■';
const HIT = '-';

function App() {
	const [score, setScore] = useState(0);
	const [bestScore, setBestScore] = useState(0);
	const [status, setStatus] = useState<StatusType>('idle');
	const [track, setTrack] = useState(Array(ARR_LENGTH).fill(EMPTY));
	const [player, setPlayer] = useState(WALK);
	const [displayMode, setDisplayMode] = useState<'uri' | 'title'>('uri');

	const frameCountRef = useRef(0);
	const jumpTicksRef = useRef(0);
	const distanceRef = useRef(0);
	const toggleRef = useRef(false);
	const intervalRef = useRef(INITIAL_FRAME_INTERVAL);

	const pointSound = useRef(new Audio('/sound/point.mp3'));
	const gameOverSound = useRef(new Audio('/sound/gameOver.mp3'));

	const playSound = (a: HTMLAudioElement) => {
		a.currentTime = 0;
		a.play().catch(() => {});
	};

	useEffect(() => {
		if (status !== 'running' && status !== 'jumping') return;

		const id = setInterval(() => {
			setTrack((prev) => {
				const newTrack = [...prev];
				newTrack.pop();
				distanceRef.current++;
				newTrack.unshift(
					distanceRef.current >= MIN_OBSTACLE_DISTANCE && Math.random() < 0.3
						? OBSTACLE
						: EMPTY
				);
				if (newTrack[0] === OBSTACLE) distanceRef.current = 0;
				return newTrack;
			});

			if (status === 'jumping') {
				jumpTicksRef.current++;
				if (jumpTicksRef.current >= JUMP_TICKS) {
					setStatus('running');
					jumpTicksRef.current = 0;
				}
			}

			if (status === 'running') {
				toggleRef.current = !toggleRef.current;
				setPlayer(toggleRef.current ? WALK : RUN);
			}

			frameCountRef.current++;
			if (frameCountRef.current % SCORE_TICKS === 0) {
				setScore((s) => {
					const next = s + 1;
					if (next % SCORE_TICKS === 0) {
						playSound(pointSound.current);
						intervalRef.current = Math.max(50, intervalRef.current - 10);
					}
					return next;
				});
			}
		}, intervalRef.current);

		return () => clearInterval(id);
	}, [status]);

	useEffect(() => {
		if (status === 'running' && track[PLAYER_INDEX] === OBSTACLE) {
			setBestScore((prev) => {
				if (prev < score) {
					return score;
				}
				return prev;
			});
			setStatus('gameOver');
			setPlayer(DEAD);
			playSound(gameOverSound.current);
		}
	}, [track, status, score]);

	useEffect(() => {
		let display = [...track];
		if (status === 'jumping') {
			display = display.map((c) => (c === OBSTACLE ? HIT : c));
			display[PLAYER_INDEX] = RUN;
		} else {
			display[PLAYER_INDEX] = player;
		}
		const text =
			status === 'idle'
				? 'Press_SPACE_to_start'
				: status === 'gameOver'
				? 'GAME_OVER'
				: display.join('');
		if (displayMode === 'uri') {
			window.location.hash = text;
		} else {
			document.title = text;
		}
	}, [track, player, status, displayMode]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden && status === 'running') {
				setStatus('paused');
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () =>
			document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [status]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.repeat || e.code !== 'Space') return;
			e.preventDefault();

			if (status === 'idle') setStatus('running');
			else if (status === 'running') setStatus('jumping');
			else if (status === 'paused') setStatus('running');
			else if (status === 'gameOver') {
				setTrack(Array(ARR_LENGTH).fill(EMPTY));
				setScore(0);
				setStatus('idle');
				setPlayer(WALK);
				frameCountRef.current = 0;
				distanceRef.current = 0;
				intervalRef.current = INITIAL_FRAME_INTERVAL;
			}
		};
		window.addEventListener('keydown', down);
		return () => window.removeEventListener('keydown', down);
	}, [status]);

	useEffect(() => {
		if (displayMode === 'uri') {
			document.title = 'headerRunner';
		} else {
			window.location.hash = 'headerRunner';
		}
	}, [displayMode]);

	return (
		<div className='app-container'>
			<h1>Header Runner</h1>

			<div className='score'>
				{status === 'idle' ? (
					<span>
						Best Score: <strong>{bestScore}</strong>
					</span>
				) : (
					<span>
						Score: <strong>{score}</strong>
					</span>
				)}
			</div>

			{status === 'idle' && (
				<div className='display-mode'>
					<label htmlFor='display-mode'>
						Display mode:{' '}
						<select
							id='display-mode'
							value={displayMode}
							onChange={(e) =>
								setDisplayMode(e.target.value as 'uri' | 'title')
							}
							aria-label='Choose display mode'
						>
							<option value='uri'>URI (hash)</option>
							<option value='title'>Title</option>
						</select>
					</label>
				</div>
			)}

			{status === 'paused' && (
				<div className='status-paused'>PAUSED - Press SPACE to continue</div>
			)}
			{status === 'idle' && <div>Press SPACE to start</div>}
			{status === 'gameOver' && (
				<div className='status-gameOver'>
					GAME OVER - Press SPACE to restart
				</div>
			)}

			<footer>
				<div>
					Powered by{' '}
					<a href='https://intorandom.com' target='_blank' rel='noreferrer'>
						intoRandom
					</a>
				</div>
				-
				<div>
					Check{' '}
					<a
						href='https://github.com/intoRandom/header-runner'
						target='_blank'
						rel='noreferrer'
					>
						source code
					</a>
				</div>
			</footer>
		</div>
	);
}
export default App;
