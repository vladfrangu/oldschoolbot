/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import { KlasaClient, KlasaUser } from 'klasa';
import { EquipmentSlot } from 'oldschooljs/dist/meta/types';

import { GearTypes } from '..';
import BankImageTask from '../../../tasks/bankImage';
import { UserSettings } from '../../settings/types/UserSettings';
import { canvasImageFromBuffer } from '../../util';
import { drawItemQuantityText } from '../../util/drawItemQuantityText';
import { drawTitleText } from '../../util/drawTitleText';
import { fillTextXTimesInCtx } from '../../util/fillTextXTimesInCtx';
import { maxDefenceStats, maxOffenceStats } from '../data/maxGearStats';
import readableGearTypeName from './readableGearTypeName';
import { sumOfSetupStats } from './sumOfSetupStats';

const gearTemplateFile = fs.readFileSync('./resources/images/gear_template.png');

/**
 * The default gear in a gear setup, when nothing is equipped.
 */
const slotCoordinates: { [key in EquipmentSlot]: [number, number] } = {
	[EquipmentSlot.TwoHanded]: [15, 110],
	[EquipmentSlot.Ammo]: [112, 71],
	[EquipmentSlot.Body]: [71, 110],
	[EquipmentSlot.Cape]: [30, 71],
	[EquipmentSlot.Feet]: [71, 190],
	[EquipmentSlot.Hands]: [16, 190],
	[EquipmentSlot.Head]: [71, 31],
	[EquipmentSlot.Legs]: [71, 149],
	[EquipmentSlot.Neck]: [70, 71],
	[EquipmentSlot.Ring]: [127, 190],
	[EquipmentSlot.Shield]: [127, 110],
	[EquipmentSlot.Weapon]: [15, 108]
};

const slotSize = 36;

let bankTask: BankImageTask | null = null;

function drawText(canvas: Canvas, text: string, x: number, y: number, maxStat = true) {
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#000000';
	fillTextXTimesInCtx(ctx, text, x + 1, y + 1);
	if (text.includes(':')) {
		const texts = text.split(':');
		for (let i = 0; i < texts.length; i++) {
			const t = texts[i] + (i === 0 ? ': ' : '');
			ctx.fillStyle = i === 0 ? '#ff981f' : maxStat ? '#00ff00' : '#ffffff';
			fillTextXTimesInCtx(
				ctx,
				t,
				i === 0
					? x - (ctx.textAlign === 'end' ? ctx.measureText(texts[i + 1]).width - 3 : 0)
					: ctx.textAlign === 'end'
					? x
					: ctx.measureText(texts[i - 1]).width + x + 3,
				y
			);
		}
	} else {
		ctx.fillStyle = '#ff981f';
		fillTextXTimesInCtx(ctx, text, x, y);
	}
}

export async function generateGearImage(
	client: KlasaClient,
	user: KlasaUser,
	gearSetup: GearTypes.GearSetup,
	gearType: GearTypes.GearSetupTypes,
	petID: number | null
) {
	// Init the background images if they are not already
	if (!bankTask) {
		bankTask = client.tasks.get('bankImage') as BankImageTask;
	}

	const userBgID = user.settings.get(UserSettings.BankBackground) ?? 1;
	const userBg = bankTask?.backgroundImages.find(i => i.id === userBgID)?.image;

	const gearStats = sumOfSetupStats(gearSetup);
	const gearTemplateImage = await canvasImageFromBuffer(gearTemplateFile);
	const canvas = createCanvas(gearTemplateImage.width, gearTemplateImage.height);
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(
		userBg,
		(canvas.width - userBg?.width!) * 0.5,
		(canvas.height - userBg?.height!) * 0.5
	);
	ctx.drawImage(gearTemplateImage, 0, 0, gearTemplateImage.width, gearTemplateImage.height);
	bankTask?.drawBorder(canvas, false);

	ctx.font = '16px OSRSFontCompact';
	// Draw preset title
	drawTitleText(ctx, readableGearTypeName(gearType), Math.floor(176 / 2), 25);

	// Draw stats
	ctx.save();
	ctx.translate(225, 0);
	ctx.font = '16px RuneScape Bold 12';
	ctx.textAlign = 'start';
	drawText(canvas, `Attack bonus`, 0, 25);
	ctx.font = '16px OSRSFontCompact';
	drawText(
		canvas,
		`Stab: ${gearStats.attack_stab}`,
		0,
		50,
		maxOffenceStats.attack_stab === gearStats.attack_stab
	);
	drawText(
		canvas,
		`Slash: ${gearStats.attack_slash}`,
		0,
		68,
		maxOffenceStats.attack_slash === gearStats.attack_slash
	);
	drawText(
		canvas,
		`Crush: ${gearStats.attack_crush}`,
		0,
		86,
		maxOffenceStats.attack_crush === gearStats.attack_crush
	);
	drawText(
		canvas,
		`Ranged: ${gearStats.attack_ranged}`,
		0,
		104,
		maxOffenceStats.attack_ranged === gearStats.attack_ranged
	);
	drawText(
		canvas,
		`Magic: ${gearStats.attack_magic}`,
		0,
		122,
		maxOffenceStats.attack_magic === gearStats.attack_magic
	);
	ctx.restore();
	ctx.save();
	ctx.translate(canvas.width - bankTask.borderVertical?.width! * 2, 0);
	ctx.font = '16px RuneScape Bold 12';
	ctx.textAlign = 'end';
	drawText(canvas, `Defence bonus`, 0, 25);
	ctx.font = '16px OSRSFontCompact';
	drawText(
		canvas,
		`Stab: ${gearStats.defence_stab}`,
		0,
		50,
		maxDefenceStats.defence_stab === gearStats.defence_stab
	);
	drawText(
		canvas,
		`Slash: ${gearStats.defence_slash}`,
		0,
		68,
		maxDefenceStats.defence_slash === gearStats.defence_slash
	);
	drawText(
		canvas,
		`Crush: ${gearStats.defence_crush}`,
		0,
		86,
		maxDefenceStats.defence_crush === gearStats.defence_crush
	);
	drawText(
		canvas,
		`Ranged: ${gearStats.defence_ranged}`,
		0,
		104,
		maxDefenceStats.defence_ranged === gearStats.defence_ranged
	);
	drawText(
		canvas,
		`Magic: ${gearStats.defence_magic}`,
		0,
		122,
		maxDefenceStats.defence_magic === gearStats.defence_magic
	);
	ctx.textAlign = 'center';
	ctx.restore();
	drawTitleText(ctx, 'Others', 210 + Math.floor(232 / 2), 140);
	ctx.restore();
	ctx.save();
	ctx.translate(225, 0);
	ctx.font = '16px OSRSFontCompact';
	ctx.textAlign = 'start';
	drawText(canvas, `Melee Str.: ${gearStats.melee_strength}`, 0, 165, false);
	drawText(canvas, `Ranged Str.: ${gearStats.ranged_strength}`, 0, 183, false);
	// drawText(canvas, `Undead: ${(0).toFixed(1)} %`, 0, 201, false);
	ctx.restore();
	ctx.save();
	ctx.translate(canvas.width - bankTask?.borderVertical?.width! * 2, 0);
	ctx.font = '16px OSRSFontCompact';
	ctx.textAlign = 'end';
	drawText(canvas, `Magic Dmg.: ${gearStats.magic_damage.toFixed(1)}%`, 0, 165, false);
	drawText(canvas, `Prayer: ${gearStats.prayer}`, 0, 183, false);
	// drawText(canvas, `Slayer: ${(0).toFixed(1)} %`, 0, 201, false);
	ctx.restore();

	// Draw items
	if (petID) {
		const image = await client.tasks.get('bankImage')!.getItemImage(petID);
		ctx.drawImage(
			image,
			178 + slotSize / 2 - image.width / 2,
			190 + slotSize / 2 - image.height / 2,
			image.width,
			image.height
		);
	}

	for (const enumName of Object.values(EquipmentSlot)) {
		const item = gearSetup[enumName];
		if (!item) continue;
		const image = await client.tasks.get('bankImage')!.getItemImage(item.item);

		const [x, y] = slotCoordinates[enumName];

		ctx.drawImage(
			image,
			x + slotSize / 2 - image.width / 2,
			y + slotSize / 2 - image.height / 2,
			image.width,
			image.height
		);

		if (item.quantity > 1) {
			drawItemQuantityText(ctx, item.quantity, x + 1, y + 9);
		}
	}

	return canvas.toBuffer();
}
