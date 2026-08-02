package model

const MailQueue string = "mail"
const ModerationQueue string = "moderation"

const ModerationRoute = "https://api.openai.com/v1/moderations"
const ModerationTypeReviewText = "reviewText"
const ModerationTypeImage = "image"

const MinRating int8 = 1
const MaxRating int8 = 5
