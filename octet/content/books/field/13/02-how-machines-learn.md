+++
title = "How machines learn"
summary = "Supervised, unsupervised and reinforcement learning, and why data quality decides the result."
links = ["field/13/01-what-ai-means-here", "field/13/03-predictive-ai", "field/13/07-risks-and-responsible-use"]
+++

A model is only as good as the examples it learned from. That sentence explains most of the successes and most of the disappointments you will see with AI on a network. This page covers the vocabulary of learning, the three main styles, and the ways the data goes wrong.

## Training and inference

Machine learning has two phases. In *training*, software studies a large set of data and adjusts itself until it captures the patterns in it. The result is a *model*. In *inference*, you give the finished model new data and it produces an answer: a label, a score or a prediction.

Training is slow and expensive and happens occasionally, often in a vendor's cloud. Inference is fast and happens constantly, sometimes on the device itself. When a product says it "uses ML", it usually means a model was trained earlier and is now running inference on your live telemetry.

## Supervised learning

In *supervised learning* each training example comes with the right answer, called a *label*. You show the system thousands of flows tagged "normal" or "attack", and it learns what separates them. Afterward it labels new flows itself.

It suits two jobs. *Classification* picks a category: is this email spam, is this flow malware? *Prediction* (often called regression) estimates a number: how many gigabits will this link carry next month?

The catch is the labels. Someone has to produce them, and for rare events such as real attacks there may be few examples.

## Unsupervised learning

In *unsupervised learning* there are no labels. The system looks at raw data and finds structure by itself: *clusters* of similar behavior and *outliers* that fit nowhere. This is the basis of most *anomaly detection* in networks. You do not need to have seen the failure before. The model only needs to learn what ordinary looks like, and anything far from it stands out.

The trade-off is that "unusual" is not the same as "bad". A new backup job is unusual and harmless. A human still decides what an outlier means.

## Reinforcement learning

In *reinforcement learning* a system tries actions and receives a reward or penalty, then adjusts to earn more reward. Nobody supplies the right answer. It discovers it by trial. Game-playing programs and robot control use it. In networks it appears in research and in some traffic and radio tuning, where the system tries a setting, measures the result and keeps what works.

| Style | Data it needs | Typical network use |
| --- | --- | --- |
| Supervised | Examples with labels | Classify traffic as normal or malicious |
| Unsupervised | Unlabeled data | Find devices behaving unlike their peers |
| Reinforcement | A reward signal from trying actions | Tune a setting by trial and measured result |

```question
prompt = "You feed a system a year of unlabeled switch telemetry and ask it to group devices that behave alike and flag any that fit no group. Which learning style is this?"
options = ["Supervised, because the data is historical", "Reinforcement, because it makes decisions", "Unsupervised, because there are no labels and it finds structure itself", "Supervised, because it flags problems"]
answer = 2
why = "No labels were supplied. Grouping and outlier detection are the standard unsupervised tasks."
```

## Data quality decides the result

A model cannot be better than its data. Four problems come up again and again.

- **Missing data.** If a sensor was off for a week, the model has a blind spot for that period.
- **Biased data.** If you trained only on a quiet branch office, the model will treat a busy campus as abnormal.
- **Old data.** A network changes. A model trained before you added video conferencing may flag normal traffic as odd.
- **Wrong labels.** If past incidents were tagged carelessly, the model learns the carelessness.

The saying is "garbage in, garbage out", and it is exact here.

## Overfitting

*Overfitting* means a model has memorized its training data instead of learning the general pattern. It scores brilliantly on the examples it studied and badly on anything new. Think of a student who memorizes last year's answer sheet. Give them a fresh question and they are lost.

The usual defense is to keep some data aside during training and test the model on it afterward. If it does well on data it never saw, it learned something real.

```trap
A vendor demo that works perfectly on the vendor's sample data proves little. A model must be judged on data it has not seen, preferably yours.
```

```question
prompt = "A model detects every attack in its training set but misses most attacks in live traffic. What is the most likely cause?"
options = ["Inference is too slow", "The model is overfit to its training data", "The model uses reinforcement learning", "The network has too many labels"]
answer = 1
why = "Perfect results on training data with poor results on new data is the signature of overfitting: it memorized instead of generalizing."
```

```recall
front = "What is the difference between training and inference?"
back = "Training builds the model from data. Inference uses the finished model to answer for new data."
```

```recall
front = "Which learning style uses labeled examples, and which finds clusters and outliers without labels?"
back = "Supervised uses labels. Unsupervised uses none and finds clusters and outliers, which is the basis of anomaly detection."
```

```recall
front = "What is overfitting?"
back = "A model memorizing its training data so it performs well on that data and poorly on new data."
```
