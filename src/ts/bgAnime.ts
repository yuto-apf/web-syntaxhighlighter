type StarConfig = {
    angle: number,
    z:     number,
    delay: string,
};

export default function bgAnime() {
    const bg = document.getElementsByClassName('bg')[0];
    const stars = document.createElement('div');
    const starsProps: StarConfig[] = [
        { angle: 0,   z: -100, delay: '-2.0s' },
        { angle: 30,  z: -200, delay: '-1.3s' },
        { angle: 60,  z: -10,  delay: '-4.2s' },
        { angle: 90,  z: -90,  delay: '-3.3s' },
        { angle: 120, z: -180, delay: '-2.1s' },
        { angle: 150, z: -300, delay: '-5.3s' },
        { angle: 180, z: -150, delay: '-6.7s' },
        { angle: 210, z: -220, delay: '-1.5s' },
        { angle: 240, z: -250, delay: '-2.4s' },
        { angle: 270, z: -30,  delay: '-3.1s' },
        { angle: 300, z: -80,  delay: '-5.0s' },
        { angle: 330, z: -120, delay: '-7.1s' },
    ];

    stars.classList.add('stars');
    bg.appendChild(stars);
    starsProps.forEach(({ angle, z, delay }) => {
        const star = document.createElement('span');
        star.classList.add('star');
        star.style.setProperty('--angle', `${angle}deg`);
        star.style.setProperty('--z',     `${z}px`);
        star.style.setProperty('--delay', delay);
        stars.appendChild(star);
    });
}